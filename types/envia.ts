export interface TrackingRequest {
  trackingNumbers: string[];
}

export interface TrackingResponse {
  data: Array<{
    trackingNumber: string;
    status: string;
    history: {
      status: string;
      location: string;
      date: string;
    }[];
  }>;
}
