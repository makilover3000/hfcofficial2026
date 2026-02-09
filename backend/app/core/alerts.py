import csv
import io
from datetime import datetime, timedelta
from typing import List, Dict, Any

class AlertStore:
    def __init__(self):
        self.alerts: List[Dict[str, Any]] = []
        self.csv_rows: List[Dict[str, Any]] = []
        self._next_alert_id = 1
        self._seed()

    def _seed(self):
        now = datetime.now()
        # Pre-seed 2-3 alerts
        self.alerts = [
            {
                'id': 'alert_1',
                'timestamp': (now - timedelta(hours=2)).isoformat(),
                'severity': 'warning',
                'cluster_name': 'Ang Mo Kio — Bishan Corridor',
                'recommendation': 'Stagger heavy piling works at Blk 65A and Blk 67B to reduce cumulative noise impact on adjacent residential blocks. Recommend 2-hour alternating schedule.',
                'affected_blocks': ['Blk 65A', 'Blk 67B', 'Blk 70'],
                'resident_count': 2400,
                'status': 'pending',
                'decision_by': None
            },
            {
                'id': 'alert_2',
                'timestamp': (now - timedelta(hours=1)).isoformat(),
                'severity': 'moderate',
                'cluster_name': 'Tampines West Cluster',
                'recommendation': 'Activate dust suppression systems at elevated sites. Wind direction (NE) carrying particulates toward Blk 201-205 residential zone. Increase water misting by 40%.',
                'affected_blocks': ['Blk 201', 'Blk 203', 'Blk 205'],
                'resident_count': 1800,
                'status': 'pending',
                'decision_by': None
            },
            {
                'id': 'alert_3',
                'timestamp': (now - timedelta(minutes=30)).isoformat(),
                'severity': 'critical',
                'cluster_name': 'Woodlands North Zone',
                'recommendation': 'Immediate noise reduction required at demolition site. Current 94dB exceeds NEA limit of 75dB during residential hours. Deploy noise barriers and switch to hydraulic breaking.',
                'affected_blocks': ['Blk 888', 'Blk 889', 'Blk 890A'],
                'resident_count': 3600,
                'status': 'pending',
                'decision_by': None
            }
        ]
        self._next_alert_id = 4

        # Pre-seed 5 CSV rows
        self.csv_rows = [
            {
                'date_time': (now - timedelta(hours=6)).strftime('%Y-%m-%d %H:%M'),
                'cluster': 'Ang Mo Kio — Bishan Corridor',
                'triggering_site': 'Blk 65A',
                'violation_type': 'Noise > 85dB',
                'affected_hdb_blocks': 'Blk 65A, Blk 67B, Blk 70',
                'est_residents_affected': 2400,
                'ai_action_taken': 'Reduced piling intensity, activated noise barriers',
                'directive_sent_to': 'Perception Agent → Control Agent',
                'impact_score_before': 87,
                'impact_score_after': 62,
                'reduction_pct': 29,
                'town_council_decision': 'Pending',
                'status': 'Mitigated'
            },
            {
                'date_time': (now - timedelta(hours=5)).strftime('%Y-%m-%d %H:%M'),
                'cluster': 'Tampines West Cluster',
                'triggering_site': 'Blk 201',
                'violation_type': 'Dust > 50µg/m³',
                'affected_hdb_blocks': 'Blk 201, Blk 203, Blk 205',
                'est_residents_affected': 1800,
                'ai_action_taken': 'Activated water misting, increased suppression 40%',
                'directive_sent_to': 'Risk Agent → Control Agent',
                'impact_score_before': 72,
                'impact_score_after': 45,
                'reduction_pct': 38,
                'town_council_decision': 'Approved',
                'status': 'Resolved'
            },
            {
                'date_time': (now - timedelta(hours=4)).strftime('%Y-%m-%d %H:%M'),
                'cluster': 'Woodlands North Zone',
                'triggering_site': 'Blk 888',
                'violation_type': 'Noise > 85dB',
                'affected_hdb_blocks': 'Blk 888, Blk 889, Blk 890A',
                'est_residents_affected': 3600,
                'ai_action_taken': 'Switched to hydraulic breaking, deployed barriers',
                'directive_sent_to': 'Perception Agent → Control Agent',
                'impact_score_before': 94,
                'impact_score_after': 68,
                'reduction_pct': 28,
                'town_council_decision': 'Approved',
                'status': 'Resolved'
            },
            {
                'date_time': (now - timedelta(hours=3)).strftime('%Y-%m-%d %H:%M'),
                'cluster': 'Ang Mo Kio — Bishan Corridor',
                'triggering_site': 'Blk 67B',
                'violation_type': 'Cumulative Noise Risk',
                'affected_hdb_blocks': 'Blk 65A, Blk 67B',
                'est_residents_affected': 2400,
                'ai_action_taken': 'Staggered work schedules between adjacent sites',
                'directive_sent_to': 'Risk Agent → Control Agent → Verification',
                'impact_score_before': 82,
                'impact_score_after': 58,
                'reduction_pct': 29,
                'town_council_decision': 'Pending',
                'status': 'Mitigated'
            },
            {
                'date_time': (now - timedelta(hours=1)).strftime('%Y-%m-%d %H:%M'),
                'cluster': 'Tampines West Cluster',
                'triggering_site': 'Blk 203',
                'violation_type': 'Dust > 50µg/m³',
                'affected_hdb_blocks': 'Blk 201, Blk 203',
                'est_residents_affected': 1200,
                'ai_action_taken': 'Increased dust suppression to 90%, paused excavation',
                'directive_sent_to': 'Control Agent → Verification Agent',
                'impact_score_before': 65,
                'impact_score_after': 38,
                'reduction_pct': 42,
                'town_council_decision': 'Approved',
                'status': 'Resolved'
            }
        ]

    def get_alerts(self) -> List[Dict[str, Any]]:
        return self.alerts

    def get_alert(self, alert_id: str) -> Dict[str, Any] | None:
        for a in self.alerts:
            if a['id'] == alert_id:
                return a
        return None

    def approve_alert(self, alert_id: str) -> Dict[str, Any] | None:
        a = self.get_alert(alert_id)
        if a:
            a['status'] = 'approved'
            a['decision_by'] = 'Town Council'
            self._sync_csv_decision(a['cluster_name'], 'Approved')
            return a
        return None

    def override_alert(self, alert_id: str) -> Dict[str, Any] | None:
        a = self.get_alert(alert_id)
        if a:
            a['status'] = 'overridden'
            a['decision_by'] = 'Town Council'
            self._sync_csv_decision(a['cluster_name'], 'Overridden')
            return a
        return None

    def _sync_csv_decision(self, cluster_name: str, decision: str):
        """Update the most recent matching CSV row with the council decision."""
        for row in reversed(self.csv_rows):
            if row.get('cluster') == cluster_name and row.get('town_council_decision') == 'Pending':
                row['town_council_decision'] = decision
                break

    def add_alert(self, alert: Dict[str, Any]) -> Dict[str, Any]:
        alert['id'] = f'alert_{self._next_alert_id}'
        self._next_alert_id += 1
        if 'timestamp' not in alert:
            alert['timestamp'] = datetime.now().isoformat()
        if 'status' not in alert:
            alert['status'] = 'pending'
        self.alerts.append(alert)
        return alert

    def add_csv_row(self, row: Dict[str, Any]):
        self.csv_rows.append(row)

    def generate_csv(self) -> str:
        output = io.StringIO()
        fieldnames = [
            'Date', 'Time', 'Cluster', 'Triggering Site', 'Violation Type',
            'Affected HDB Blocks', 'Est. Residents Affected', 'AI Action Taken',
            'Directive Sent To', 'Impact Score Before', 'Impact Score After',
            'Reduction %', 'Town Council Decision', 'Status'
        ]
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()

        for row in self.csv_rows:
            date_time = row.get('date_time', '')
            date_part = ''
            time_part = ''
            if date_time and ' ' in date_time:
                date_part, time_part = date_time.split(' ', 1)
            else:
                date_part = date_time

            writer.writerow({
                'Date': date_part,
                'Time': time_part,
                'Cluster': row.get('cluster', ''),
                'Triggering Site': row.get('triggering_site', ''),
                'Violation Type': row.get('violation_type', ''),
                'Affected HDB Blocks': row.get('affected_hdb_blocks', ''),
                'Est. Residents Affected': row.get('est_residents_affected', ''),
                'AI Action Taken': row.get('ai_action_taken', ''),
                'Directive Sent To': row.get('directive_sent_to', ''),
                'Impact Score Before': row.get('impact_score_before', ''),
                'Impact Score After': row.get('impact_score_after', ''),
                'Reduction %': row.get('reduction_pct', ''),
                'Town Council Decision': row.get('town_council_decision', ''),
                'Status': row.get('status', '')
            })

        return output.getvalue()
