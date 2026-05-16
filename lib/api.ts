export const loginUser = async (email: string, password: string) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockResponse = {
    token: 'mock-token-123',
    user: {
      id: 1,
      name: 'Admin User',
      email: email
    }
  };
  
  localStorage.setItem('token', mockResponse.token);
  localStorage.setItem('user', JSON.stringify(mockResponse.user));
  
  return mockResponse;
};

export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('token');
};