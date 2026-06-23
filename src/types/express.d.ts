declare namespace Express {
  interface Request {
    user: {
      id: string;
      isAdmin: boolean;
      email: string;
    };
  }
}