const normalizeMedicine = (medicine) => {
  if (typeof medicine !== "string") {
    return "";
  }

  const normalized = medicine.trim().toLowerCase();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : "";
};

module.exports = { normalizeMedicine };
