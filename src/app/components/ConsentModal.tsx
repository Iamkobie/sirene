import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { C, ui } from "../constants/theme";

interface ConsentModalProps {
  onClose: () => void;
}

export function ConsentModal({ onClose }: ConsentModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState<"agree" | "decline" | null>(null);

  const handleAgree = async () => {
    setLoading(true);
    setLoadingAction("agree");
    try {
      await supabase.auth.updateUser({
        data: { agreed_to_share_audio: true }
      });
      await supabase.auth.refreshSession();
      onClose();
    } catch (error) {
      console.error("Error updating user consent:", error);
      setLoading(false);
      setLoadingAction(null);
    }
  };

  const handleDecline = async () => {
    setLoading(true);
    setLoadingAction("decline");
    try {
      await supabase.auth.updateUser({
        data: { agreed_to_share_audio: false }
      });
      await supabase.auth.refreshSession();
      onClose();
    } catch (error) {
      console.error("Error updating user consent:", error);
      setLoading(false);
      setLoadingAction(null);
    }
  };

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "rgba(0, 0, 0, 0.85)",
      backdropFilter: "blur(8px)",
      padding: "20px"
    }}>
      <div style={{
        maxWidth: 600,
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto",
        background: C.surface,
        border: `2px solid ${C.border}`,
        borderRadius: 16,
        padding: "32px",
        boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)"
      }}>
        <h2 style={{
          ...ui,
          fontSize: 22,
          fontWeight: 900,
          color: C.text,
          margin: "0 0 20px",
          lineHeight: 1.3
        }}>
          Help Us Build Better Voice Technology for Filipino Languages
        </h2>

        <div style={{
          ...ui,
          fontSize: 14,
          color: C.text,
          lineHeight: 1.7,
          marginBottom: "28px"
        }}>
          <p style={{ margin: "0 0 16px" }}>
            By using Sirene, you contribute voice recordings that help advance speech technology
            for underrepresented Philippine languages such as Cebuano, Ilocano, Hiligaynon, and Waray.
          </p>
          <p style={{ margin: "0 0 16px" }}>
            Before you begin, we'd like your consent to use your recordings as part of an open dataset
            for research and future development of voice-driven technologies.
          </p>

          <div style={{
            background: "rgba(255, 255, 255, 0.03)",
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            padding: "16px",
            marginBottom: "16px"
          }}>
            <div style={{ fontWeight: 700, marginBottom: "8px", color: C.text }}>What we collect:</div>
            <ul style={{ margin: 0, paddingLeft: "20px", color: C.text }}>
              <li>Your voice recordings</li>
              <li>The phrase you were asked to translate</li>
              <li>Your AI-generated evaluation scores</li>
            </ul>
          </div>

          <div style={{
            background: "rgba(76, 175, 125, 0.08)",
            border: `1px solid rgba(76, 175, 125, 0.3)`,
            borderRadius: 10,
            padding: "16px",
            marginBottom: "16px"
          }}>
            <div style={{ fontWeight: 700, marginBottom: "8px", color: "#4caf50" }}>What we anonymize:</div>
            <ul style={{ margin: 0, paddingLeft: "20px", color: C.text }}>
              <li>Your identity — recordings are linked only to an anonymous speaker ID, never your name or email</li>
            </ul>
          </div>

          <div style={{
            background: "rgba(255, 140, 66, 0.08)",
            border: `1px solid rgba(255, 140, 66, 0.3)`,
            borderRadius: 10,
            padding: "16px",
            marginBottom: "16px"
          }}>
            <div style={{ fontWeight: 700, marginBottom: "8px", color: C.orange }}>What we retain about you:</div>
            <ul style={{ margin: 0, paddingLeft: "20px", color: C.text }}>
              <li>Age group</li>
              <li>Gender</li>
              <li>Mother tongue</li>
            </ul>
          </div>

          <p style={{ margin: 0, color: C.textMuted }}>
            You can decline and still use the app freely. If you decline, your recordings will not
            be saved to the dataset. You may not be asked again after this.
          </p>
        </div>

        <div style={{
          display: "flex",
          gap: "12px",
          justifyContent: "flex-end"
        }}>
          <button
            onClick={handleDecline}
            disabled={loading}
            style={{
              ...ui,
              padding: "12px 24px",
              borderRadius: 10,
              border: `2px solid ${C.border}`,
              background: "transparent",
              color: C.textMuted,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading && loadingAction !== "decline" ? 0.5 : 1
            }}
          >
            {loading && loadingAction === "decline" ? "Processing..." : "No Thanks, I'll Opt Out"}
          </button>

          <button
            onClick={handleAgree}
            disabled={loading}
            style={{
              ...ui,
              padding: "12px 24px",
              borderRadius: 10,
              border: "none",
              background: C.red,
              color: "#fff",
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: `0 4px 16px ${C.red}44`,
              opacity: loading && loadingAction !== "agree" ? 0.5 : 1
            }}
          >
            {loading && loadingAction === "agree" ? "Processing..." : "I Agree — Use My Recordings"}
          </button>
        </div>
      </div>
    </div>
  );
}
