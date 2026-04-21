export interface JwtPayload {
  sub:         string;
  email:       string;
  roles:       string[];
  permissions: string[];
  iat?:        number;
  exp?:        number;
}

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface Order {
  id:        string;
  userId:    string;
  product:   string;
  quantity:  number;
  price:     number;
  status:    OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrderDto {
  product:  string;
  quantity: number;
  price:    number;
}

export interface UpdateOrderDto {
  product?:  string;
  quantity?: number;
  price?:    number;
  status?:   OrderStatus;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}
