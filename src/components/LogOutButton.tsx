export default function LogoutButton({ onLogout }: { onLogout: () => void }) {
  return (
    <button
      onClick={onLogout}
      style={{
        padding: "10px 16px",
        borderRadius: "8px",
        background: "#e74c3c",
        color: "white",
        border: "none",
        cursor: "pointer",
        fontSize: "16px"
      }}
    >
      Log uit
    </button>
  );
}
