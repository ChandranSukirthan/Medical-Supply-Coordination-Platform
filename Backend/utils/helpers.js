exports.generateId = (prefix) => {
  return prefix + Math.floor(1000 + Math.random() * 9000).toString() + Date.now().toString().slice(-4);
};
