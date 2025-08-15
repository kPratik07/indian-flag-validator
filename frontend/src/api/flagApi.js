export async function uploadFlag(file) {
  const formData = new FormData();
  formData.append("flag", file);

  const response = await fetch("http://localhost:5000/api/validate-flag", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to validate flag. Please try again.");
  }
  return await response.json();
}
