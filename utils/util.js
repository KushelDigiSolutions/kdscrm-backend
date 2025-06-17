const removeUndefined = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter((e) => e[1] !== undefined)
  );
};

const removeUndefined1 = (obj) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => value !== undefined)
  );
};

export { removeUndefined, removeUndefined1 };
