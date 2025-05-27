
import React from 'react';
import type { AnalysisData } from './types'; // Updated import path

interface AnalysisDisplayProps {
  analysis: AnalysisData;
}

const SECTION_TITLES: { [K in keyof Required<AnalysisData>]: string } = {
  resistanceSupport: ' Resistance & Support Levels',
  trends: 'Trends Analysis',
  chartPatterns: ' Chart Patterns',
  candlestickPatterns: 'Candlestick Patterns',
  volumeAnalysis: ' Volume Analysis',
  momentum: 'Momentum Insights',
};

export const AnalysisDisplay: React.FC<AnalysisDisplayProps> = ({ analysis }) => {
  const sections = Object.keys(SECTION_TITLES) as (keyof AnalysisData)[];

  return (
    <div className="space-y-8">
      {sections.map((key) => {
        const content = analysis[key];
        if (!content) return null;

        return (
          <div key={key as string} className="bg-gray-800 p-6 rounded-lg shadow-xl transition-all duration-300 hover:shadow-purple-500/30">
            <h3 className="text-2xl font-semibold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
              {SECTION_TITLES[key as keyof Required<AnalysisData>] || (key as string).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h3>
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-gray-300 leading-relaxed whitespace-pre-wrap">
              {content.split('\\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
