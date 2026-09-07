from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models.warning import EarlyWarning
from backend.app.models.location import Location

class AlertService:
    def __init__(self):
        # Configurable Prototype Operational Thresholds
        self.thresholds = {
            "LOW_MAX": 25.0,
            "MODERATE_MAX": 50.0,
            "HIGH_MAX": 75.0,
            "CRITICAL_MIN": 75.0,
            "AUTO_ALERT_MIN": 40.0  # Threshold to automatically generate warnings in database
        }

    def get_thresholds(self) -> Dict[str, Any]:
        return {
            "thresholds": self.thresholds,
            "disclaimer": "These thresholds are prototype operational guidelines configured for the SIH 2026 prototype and require site-specific domain calibration before production deployment."
        }

    def update_thresholds(self, new_thresholds: Dict[str, float]) -> Dict[str, Any]:
        for k, v in new_thresholds.items():
            if k in self.thresholds:
                self.thresholds[k] = float(v)
        return self.get_thresholds()

    def classify_severity(self, risk_percentage: float) -> str:
        if risk_percentage >= self.thresholds["CRITICAL_MIN"]:
            return "CRITICAL"
        elif risk_percentage >= self.thresholds["MODERATE_MAX"]:
            return "HIGH"
        elif risk_percentage >= self.thresholds["LOW_MAX"]:
            return "MODERATE"
        else:
            return "LOW"

    def process_risk_and_trigger(
        self,
        location: Location,
        risk_percentage: float,
        risk_category: str,
        contributing_factors_summary: str,
        recommended_action: str,
        db: Session
    ) -> Optional[EarlyWarning]:
        """
        Evaluates risk against operational thresholds and creates/updates EarlyWarning records.
        """
        if risk_percentage < self.thresholds["AUTO_ALERT_MIN"]:
            return None

        # Check for existing unacknowledged warning for this location
        existing = (
            db.query(EarlyWarning)
            .filter(
                EarlyWarning.location_id == location.id,
                EarlyWarning.acknowledged == False
            )
            .first()
        )

        if existing:
            existing.severity = risk_category
            existing.risk_probability = risk_percentage
            existing.main_factors = contributing_factors_summary
            existing.recommended_action = recommended_action
            db.commit()
            db.refresh(existing)
            return existing
        else:
            new_warning = EarlyWarning(
                location_id=location.id,
                severity=risk_category,
                risk_probability=risk_percentage,
                main_factors=contributing_factors_summary,
                recommended_action=recommended_action,
                acknowledged=False,
                created_at=datetime.now(timezone.utc)
            )
            db.add(new_warning)
            db.commit()
            db.refresh(new_warning)
            return new_warning

    def simulate_broadcast(
        self,
        warning_id: int,
        channels: List[str],
        db: Session
    ) -> Dict[str, Any]:
        """
        Simulates emergency broadcast dissemination across multiple channels.
        """
        warning = db.query(EarlyWarning).filter(EarlyWarning.id == warning_id).first()
        if not warning:
            raise ValueError(f"Warning ID {warning_id} not found")

        loc = db.query(Location).filter(Location.id == warning.location_id).first()
        loc_name = loc.name if loc else "Monitored Sector"
        pop_count = loc.population_exposed if loc else 50000

        broadcast_log = []
        for ch in channels:
            ch_upper = ch.upper()
            if ch_upper == "SMS":
                broadcast_log.append({
                    "channel": "EMERGENCY_SMS_GATEWAY",
                    "status": "SENT",
                    "target": f"{pop_count:,} registered telecom subscribers in {loc_name}",
                    "message": f"BHUSHAKTI AI ALERT: {warning.severity} Landslide Risk in {loc_name}. {warning.recommended_action}"
                })
            elif ch_upper == "CAP_BROADCAST":
                broadcast_log.append({
                    "channel": "NDMA_COMMON_ALERTING_PROTOCOL",
                    "status": "DISSEMINATED",
                    "target": "State Disaster Management Authority (SDMA) & DDMA Operations Room",
                    "payload_type": "CAP-v1.2 XML Feed"
                })
            elif ch_upper == "RADIO_SIREN":
                broadcast_log.append({
                    "channel": "COMMUNITY_SIREN_&_FM_RADIO",
                    "status": "TRIGGERED",
                    "target": f"Public address towers and local FM stations across {loc_name}",
                    "tone": "High-Urgency Warning Wave"
                })

        return {
            "warning_id": warning_id,
            "location": loc_name,
            "severity": warning.severity,
            "timestamp": datetime.now(timezone.utc),
            "channels_broadcasted": broadcast_log,
            "status": "BROADCAST_COMPLETED"
        }

# Singleton instance
alert_service = AlertService()
