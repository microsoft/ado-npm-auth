const truthy = [true, "true", "TRUE", 1];

/**
 * Determines if the current machine's setup is codespaces
 * @returns { boolean } if the current machine is in codespaces
 */
export const isCodespaces = () => {
  const codespaces = process.env["CODESPACES"] || "";
  return truthy.includes(codespaces);
};
