const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function uploadFlag(file) {
  const formData = new FormData();
  formData.append("flag", file);

  const response = await fetch(`${API_BASE_URL}/api/validate-flag`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to validate flag. Please try again.");
  }
  return await response.json();
}
