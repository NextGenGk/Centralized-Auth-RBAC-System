export interface JwtPayload {
  sub:         string;
  email:       string;
  roles:       string[];
  permissions: string[];
  iat?:        number;
  exp?:        number;
}

export interface TokenPair {
  accessToken:  string;
  refreshToken: string;
}

export interface SafeUser {
  id:        string;
  email:     string;
  isActive:  boolean;
  createdAt: Date;
  roles:     string[];
}

// Augment Express Request so req.user is typed everywhere
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
