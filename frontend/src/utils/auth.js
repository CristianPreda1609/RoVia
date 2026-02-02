export const getUserRole = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const payload = JSON.parse(jsonPayload);
    // ClaimTypes.Role key can vary. Often "role" or the full URI
    return payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] || payload.role || "Visitor";
  } catch (e) {
    console.error("Error decoding token:", e);
    return null;
  }
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};
