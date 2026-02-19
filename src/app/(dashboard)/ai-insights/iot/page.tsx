'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Wifi,
    WifiOff,
    Thermometer,
    Activity,
    AlertTriangle,
    RefreshCw,
    Server
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

export default function IoTDashboard() {
    const [data, setData] = useState<any>({ devices: [], alerts: [] });
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/iot/status');
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch (error) {
            toast.error('Failed to load IoT status');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Auto-refresh every 30s
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading && !data.devices.length) return <div className="p-8">Loading IoT Grid...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">IoT Intelligence Grid</h1>
                    <p className="text-muted-foreground">Real-time sensor monitoring and incident triage.</p>
                </div>
                <Button variant="outline" onClick={fetchData}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Connected Devices</CardTitle>
                        <Server className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.devices.length}</div>
                        <p className="text-xs text-muted-foreground">
                            {data.devices.filter((d: any) => d.status === 'online').length} Online
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
                        <AlertTriangle className={`h-4 w-4 ${data.alerts.length > 0 ? 'text-red-500' : 'text-green-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{data.alerts.length}</div>
                        <p className="text-xs text-muted-foreground">
                            Requiring attention
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Alerts Section */}
            {data.alerts.length > 0 && (
                <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                        <CardTitle className="text-red-700 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" /> Critical Incidents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.alerts.map((alert: any) => (
                                <div key={alert.id} className="flex justify-between items-center p-3 bg-white rounded shadow-sm border border-red-100">
                                    <div>
                                        <h4 className="font-semibold text-red-800">{alert.type} Alert</h4>
                                        <p className="text-sm text-gray-700">{alert.message}</p>
                                        <span className="text-xs text-gray-500">Device: {alert.iotDevice?.name || 'Unknown'}</span>
                                    </div>
                                    <Badge variant={alert.severity === 'HIGH' ? 'destructive' : 'secondary'}>
                                        {alert.severity}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Device Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.devices.map((device: any) => (
                    <Card key={device.id} className={device.status === 'offline' ? 'opacity-70' : ''}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <div className="flex items-center gap-2">
                                {device.type === 'TEMPERATURE' ? <Thermometer className="h-4 w-4" /> : <Activity className="h-4 w-4" />}
                                <CardTitle className="text-base font-semibold">{device.name}</CardTitle>
                            </div>
                            {device.status === 'online' ? (
                                <Wifi className="h-4 w-4 text-green-500" />
                            ) : (
                                <WifiOff className="h-4 w-4 text-gray-400" />
                            )}
                        </CardHeader>
                        <CardContent>
                            <div className="mt-2 text-sm text-gray-600">
                                <div className="flex justify-between py-1">
                                    <span>Location:</span>
                                    <span className="font-medium">{device.location}</span>
                                </div>
                                <div className="flex justify-between py-1">
                                    <span>Last Seen:</span>
                                    <span className="font-medium">{formatDistanceToNow(new Date(device.lastSeen), { addSuffix: true })}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
