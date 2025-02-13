// JS style sheet
const styles = {
  musicButton: {
    position: "absolute",
    bottom: "20px",
    right: "20px",
    padding: "12px 18px",
    backgroundColor: "#222",
    color: "#fff",
    border: "2px solid #fff",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
    fontFamily: "Poppins, sans-serif",
    transition: "background 0.3s ease-in-out, transform 0.2s ease-in-out",
  },
  musicButtonHover: {
    backgroundColor: "#444",
    transform: "scale(1.1)",
  },
};

// Helper function to apply styles
function applyStyles(element, styles) {
  Object.assign(element.style, styles);
}

export { styles, applyStyles };
