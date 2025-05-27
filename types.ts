
export interface AnalysisData {
  resistanceSupport?: string;
  trends?: string;
  chartPatterns?: string;
  candlestickPatterns?: string;
  volumeAnalysis?: string;
  momentum?: string;
  [key: string]: string | undefined; // Allows for additional fields if API returns them
}
    