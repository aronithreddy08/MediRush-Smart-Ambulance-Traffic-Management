import math
import heapq
import json
import logging
from typing import Dict, List, Tuple, Any, Optional
import networkx as nx

from app.engines.hospital_engine import haversine_distance_km
from app.engines.ml_traffic_engine import MLTrafficPredictionEngine

logger = logging.getLogger("medirush.routing_engine")

class GraphRoutingEngine:
    def __init__(self, road_network_data: Dict[str, Any], ml_engine: MLTrafficPredictionEngine):
        self.nodes = {n["id"]: n for n in road_network_data.get("nodes", [])}
        self.edges = road_network_data.get("edges", [])
        self.ml_engine = ml_engine
        self.graph = nx.DiGraph()
        self._build_graph()

    def _build_graph(self):
        self.graph.clear()
        for node_id, node_data in self.nodes.items():
            self.graph.add_node(
                node_id,
                name=node_data["name"],
                lat=node_data["lat"],
                lng=node_data["lng"],
                type=node_data.get("type", "INTERSECTION"),
                signal_id=node_data.get("signal_id"),
                hospital_id=node_data.get("hospital_id")
            )

        for edge in self.edges:
            # Bidirectional connectivity unless one-way
            u, v = edge["from"], edge["to"]
            length_km = float(edge["length_km"])
            speed_limit = float(edge.get("speed_limit_kmh", 45.0))
            road_type = edge.get("road_type", "ARTERIAL")
            lanes = int(edge.get("lanes", 2))

            self.graph.add_edge(
                u, v,
                id=edge["id"],
                name=edge["name"],
                length_km=length_km,
                speed_limit_kmh=speed_limit,
                road_type=road_type,
                lanes=lanes
            )
            # Add reverse edge for full city traversability
            self.graph.add_edge(
                v, u,
                id=f"{edge['id']}_REV",
                name=f"{edge['name']} (Rev)",
                length_km=length_km,
                speed_limit_kmh=speed_limit,
                road_type=road_type,
                lanes=lanes
            )

    def find_nearest_node(self, lat: float, lng: float) -> str:
        best_node = None
        min_dist = float("inf")
        for node_id, node_data in self.nodes.items():
            dist = haversine_distance_km(lat, lng, node_data["lat"], node_data["lng"])
            if dist < min_dist:
                min_dist = dist
                best_node = node_id
        return best_node

    def calculate_multivariable_edge_weight(
        self,
        u: str,
        v: str,
        edge_data: Dict[str, Any],
        predicted_traffic: Dict[str, Dict[str, Any]],
        preempted_signals: List[str],
        route_mode: str = "OPTIMAL_AI"
    ) -> Tuple[float, float, float]:
        """
        Calculates dynamic edge cost, travel time (min), and congestion score.
        """
        length_km = edge_data["length_km"]
        road_id = edge_data.get("id", "").replace("_REV", "")
        base_speed = edge_data["speed_limit_kmh"]
        target_node = self.nodes[v]

        if route_mode == "SHORTEST_DISTANCE":
            # Pure distance optimization
            return length_km, (length_km / (base_speed * 0.7)) * 60.0, 0.2

        # Fetch AI predictions for this road
        pred = predicted_traffic.get(road_id, {})
        eff_speed = pred.get("predicted_speed_kmh", base_speed * 0.8)
        congestion_prob = pred.get("congestion_probability", 0.2)

        # Baseline travel time in minutes
        travel_time_min = (length_km / max(5.0, eff_speed)) * 60.0

        # Signal delay penalty
        signal_id = target_node.get("signal_id")
        signal_delay_min = 0.0
        if signal_id:
            if signal_id in preempted_signals or route_mode == "OPTIMAL_AI":
                # Preempted or priority green wave -> Near zero delay
                signal_delay_min = 0.1
            else:
                signal_delay_min = 0.65  # Avg red light wait 40 seconds

        # Road hierarchy priority bonus for emergency vehicles
        lane_bonus = 0.9 if edge_data.get("road_type") == "EXPRESSWAY" else 1.0

        if route_mode == "HIGHWAY_CORRIDOR":
            lane_bonus = 0.7 if edge_data.get("road_type") == "EXPRESSWAY" else 1.2

        # Composite cost function
        congestion_penalty = 3.5 * congestion_prob
        cost = (travel_time_min * lane_bonus) + congestion_penalty + signal_delay_min

        return cost, travel_time_min, congestion_prob

    def compute_route_paths(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float,
        preempted_signals: Optional[List[str]] = None,
        weather: str = "CLEAR"
    ) -> List[Dict[str, Any]]:
        preempted = preempted_signals or []
        start_node = self.find_nearest_node(origin_lat, origin_lng)
        dest_node = self.find_nearest_node(dest_lat, dest_lng)

        if not start_node or not dest_node or start_node == dest_node:
            # If same node or edge case, use direct interpolation
            return self._build_direct_fallback_routes(origin_lat, origin_lng, dest_lat, dest_lng)

        # Get current AI predictions for all network edges
        edge_dicts = [{"id": e["id"], "road_type": e.get("road_type", "ARTERIAL"), "speed_limit_kmh": e.get("speed_limit_kmh", 45)} for e in self.edges]
        ai_preds = self.ml_engine.predict_segments(edge_dicts, weather=weather)
        ai_pred_map = {p["road_id"]: p for p in ai_preds}

        route_options = []
        modes = [
            ("OPTIMAL_AI", "MediRush AI-Optimized Corridor", True),
            ("HIGHWAY_CORRIDOR", "Arterial Expressway Corridor", False),
            ("SHORTEST_DISTANCE", "Baseline Shortest Physical Distance", False)
        ]

        for mode_key, mode_title, is_selected in modes:
            path_nodes = self._dijkstra_custom(start_node, dest_node, ai_pred_map, preempted, mode_key)
            if not path_nodes:
                path_nodes = nx.shortest_path(self.graph, start_node, dest_node, weight="length_km")

            coords = [[origin_lat, origin_lng]]
            total_distance = 0.0
            total_time_min = 0.0
            congestion_scores = []

            for i in range(len(path_nodes) - 1):
                u_curr = path_nodes[i]
                v_curr = path_nodes[i + 1]
                edge_data = self.graph.get_edge_data(u_curr, v_curr) or {"length_km": 0.5, "speed_limit_kmh": 45, "road_type": "ARTERIAL"}
                cost, time_min, cong = self.calculate_multivariable_edge_weight(u_curr, v_curr, edge_data, ai_pred_map, preempted, mode_key)
                
                total_distance += edge_data["length_km"]
                total_time_min += time_min
                congestion_scores.append(cong)
                
                v_node = self.nodes[v_curr]
                coords.append([v_node["lat"], v_node["lng"]])

            coords.append([dest_lat, dest_lng])
            
            avg_congestion = sum(congestion_scores) / len(congestion_scores) if congestion_scores else 0.2
            traffic_label = "LOW" if avg_congestion < 0.28 else ("MODERATE" if avg_congestion < 0.55 else ("HIGH" if avg_congestion < 0.80 else "SEVERE"))

            route_options.append({
                "route_id": f"ROUTE_{mode_key}",
                "route_name": mode_title,
                "route_type": mode_key,
                "distance_km": round(total_distance + 0.3, 2),
                "estimated_time_min": round(total_time_min + 0.5, 1),
                "congestion_score": round(avg_congestion, 2),
                "traffic_level_label": traffic_label,
                "coordinates": coords,
                "is_selected": is_selected,
                "ai_confidence_score": 0.96 if mode_key == "OPTIMAL_AI" else 0.82,
                "time_saved_vs_baseline_min": 0.0
            })

        # Calculate time saved vs baseline
        baseline_time = route_options[2]["estimated_time_min"]
        for r in route_options:
            r["time_saved_vs_baseline_min"] = max(0.0, round(baseline_time - r["estimated_time_min"], 1))

        return route_options

    def _dijkstra_custom(
        self,
        start: str,
        dest: str,
        ai_pred_map: Dict[str, Dict[str, Any]],
        preempted: List[str],
        mode: str
    ) -> Optional[List[str]]:
        distances = {node: float("inf") for node in self.graph.nodes}
        previous = {node: None for node in self.graph.nodes}
        distances[start] = 0.0
        pq = [(0.0, start)]

        while pq:
            current_dist, u = heapq.heappop(pq)
            if u == dest:
                break
            if current_dist > distances[u]:
                continue

            for v in self.graph.neighbors(u):
                edge_data = self.graph.get_edge_data(u, v)
                cost, _, _ = self.calculate_multivariable_edge_weight(u, v, edge_data, ai_pred_map, preempted, mode)
                new_dist = current_dist + cost
                if new_dist < distances[v]:
                    distances[v] = new_dist
                    previous[v] = u
                    heapq.heappush(pq, (new_dist, v))

        # Reconstruct path
        path = []
        curr = dest
        while curr is not None:
            path.append(curr)
            curr = previous[curr]
        path.reverse()
        return path if path and path[0] == start else None

    def _build_direct_fallback_routes(self, lat1: float, lng1: float, lat2: float, lng2: float) -> List[Dict[str, Any]]:
        dist = haversine_distance_km(lat1, lng1, lat2, lng2)
        mid_lat = (lat1 + lat2) / 2.0
        mid_lng = (lng1 + lng2) / 2.0
        
        c1 = [[lat1, lng1], [mid_lat + 0.002, mid_lng - 0.002], [lat2, lng2]]
        c2 = [[lat1, lng1], [mid_lat - 0.003, mid_lng + 0.003], [lat2, lng2]]
        c3 = [[lat1, lng1], [mid_lat, mid_lng], [lat2, lng2]]

        return [
            {
                "route_id": "ROUTE_OPTIMAL_AI",
                "route_name": "MediRush AI-Optimized Direct Corridor",
                "route_type": "OPTIMAL_AI",
                "distance_km": round(dist, 2),
                "estimated_time_min": round((dist / 50.0) * 60.0, 1),
                "congestion_score": 0.18,
                "traffic_level_label": "LOW",
                "coordinates": c1,
                "is_selected": True,
                "ai_confidence_score": 0.95,
                "time_saved_vs_baseline_min": 2.4
            },
            {
                "route_id": "ROUTE_HIGHWAY_CORRIDOR",
                "route_name": "Bypass Highway Corridor",
                "route_type": "HIGHWAY_CORRIDOR",
                "distance_km": round(dist * 1.25, 2),
                "estimated_time_min": round((dist * 1.25 / 55.0) * 60.0, 1),
                "congestion_score": 0.35,
                "traffic_level_label": "MODERATE",
                "coordinates": c2,
                "is_selected": False,
                "ai_confidence_score": 0.85,
                "time_saved_vs_baseline_min": 1.1
            },
            {
                "route_id": "ROUTE_SHORTEST_DISTANCE",
                "route_name": "Shortest Baseline Route",
                "route_type": "SHORTEST_DISTANCE",
                "distance_km": round(dist * 1.05, 2),
                "estimated_time_min": round((dist * 1.05 / 38.0) * 60.0, 1),
                "congestion_score": 0.65,
                "traffic_level_label": "HIGH",
                "coordinates": c3,
                "is_selected": False,
                "ai_confidence_score": 0.70,
                "time_saved_vs_baseline_min": 0.0
            }
        ]
