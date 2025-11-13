import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatDateTime } from '../../lib/format';
import ProgressTimeline from '../../components/ProgressTimeline';

export default function ProgressPage() {
  const { scans, stats } = useStore((s) => ({ scans: s.scans, stats: s.stats }));
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'timeline'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card className="p-6 grid grid-cols-3 gap-4 text-center glow">
        <Stat label="Total Scans" value={stats.totalScans} />
        <Stat label="Streak" value={stats.streak} />
        <Stat label="Weekly Avg" value={stats.weeklyAverage} />
      </Card>

      {/* View Toggle */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('grid')}
            className="flex-1"
          >
            📸 Grid View
          </Button>
          <Button
            variant={viewMode === 'timeline' ? 'primary' : 'secondary'}
            onClick={() => setViewMode('timeline')}
            className="flex-1"
          >
            📈 Timeline View
          </Button>
        </div>
      </Card>

      {/* Timeline View */}
      {viewMode === 'timeline' ? (
        <ProgressTimeline scans={scans} />
      ) : (
        <>
          <Card className="p-6 space-y-4">
            <Button variant="primary" className="w-full">
              ▶️ Play Timelapse
            </Button>
            <Button variant="secondary" className="w-full">
              📤 Export Images
            </Button>
          </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {scans.length > 0 ? (
          scans.map((s) => {
            const hasMultiAngle = s.images && Object.keys(s.images).length > 1;
            return (
              <Card key={s.id} className="overflow-hidden glow">
                <div className="relative aspect-square overflow-hidden">
                  {hasMultiAngle ? (
                    <div className="grid grid-cols-2 gap-1 h-full">
                      {Object.entries(s.images).slice(0, 4).map(([angle, img]) => (
                        <div key={angle} className="relative overflow-hidden">
                          <img
                            src={img.url}
                            alt={angle}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                            {angle === 'front' ? 'Front' : angle === 'side' ? 'Side' : '3/4'}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <img
                      src={s.imageBlobUrl}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="text-sm font-bold text-white mb-1">
                        Score: {s.scores?.overall || 0}
                      </div>
                      {hasMultiAngle && (
                        <div className="text-xs text-purple-300">
                          {Object.keys(s.images).length} angles captured
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-white/10">
                  <div className="text-xs opacity-70 text-slate-300">
                    {formatDateTime(s.createdAt)}
                  </div>
                </div>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full text-center py-16 opacity-60 text-slate-400">
            <div className="text-4xl mb-4">📸</div>
            <div>No scans yet. Start your first scan!</div>
          </div>
        )}
      </div>
      </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="p-4 rounded-2xl glass border border-white/10">
      <div className="text-4xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
        {value}
      </div>
      <div className="text-xs uppercase opacity-70 text-slate-300 font-medium">{label}</div>
    </div>
  );
}

