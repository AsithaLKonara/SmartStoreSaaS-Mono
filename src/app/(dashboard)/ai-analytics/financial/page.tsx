'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    RefreshCw,
    FileText
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function FinancialDashboard() {
    const [report, setReport] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/ai/financial/audit');
            if (res.ok) {
                const data = await res.json();
                setReport(data.data);
            }
        } catch (error) {
            toast.error('Failed to load financial data');
        } finally {
            setLoading(false);
        }
    };

    const runAudit = async () => {
        const toastId = toast.loading('AI is auditing your finances...');
        try {
            const res = await fetch('/api/ai/financial/audit', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setReport(data.data);
                toast.success('Audit complete!', { id: toastId });
            } else {
                throw new Error('Audit failed');
            }
        } catch (error) {
            toast.error('Failed to run audit', { id: toastId });
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    if (loading) return <div className="p-8">Loading AI Financials...</div>;
    if (!report) return <div className="p-8 text-center"><p>No financial data available.</p><Button onClick={runAudit} className="mt-4">Run Initial Audit</Button></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">AI Financial Controller</h1>
                    <p className="text-muted-foreground">Autonomous auditing and expense optimization.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={fetchReport}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                    </Button>
                    <Button onClick={runAudit}>
                        <FileText className="mr-2 h-4 w-4" /> Run New Audit
                    </Button>
                </div>
            </div>

            {report && (
                <>
                    {/* Key Metrics */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(report.financials.revenue)}</div>
                                <p className="text-xs text-muted-foreground">
                                    +20.1% from last week
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Net Margin</CardTitle>
                                <TrendingUp className="h-4 w-4 text-green-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report.financials.margin}</div>
                                <p className="text-xs text-muted-foreground">
                                    Healthy range (&gt;15%)
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{report.anomalies}</div>
                                <p className="text-xs text-muted-foreground">
                                    Unusual spending patterns
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Est. Cost</CardTitle>
                                <TrendingDown className="h-4 w-4 text-red-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{formatCurrency(report.financials.cost)}</div>
                                <p className="text-xs text-muted-foreground">
                                    COGS for the period
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* AI Insights Section */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>AI Strategic Insights</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {report.insights.length === 0 ? (
                                        <p className="text-sm text-gray-500">No critical insights detected. Operations are normal.</p>
                                    ) : (
                                        report.insights.map((insight: any, i: number) => (
                                            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50">
                                                <div className={`p-2 rounded-full ${insight.type === 'CRITICAL' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                                                    }`}>
                                                    <AlertTriangle className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm">{insight.type} Insight</h4>
                                                    <p className="text-sm text-gray-600 mt-1">{insight.message}</p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Optimization Targets</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-sm font-medium">Supplier Negotiations</span>
                                        <Button size="sm" variant="ghost">View</Button>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-sm font-medium">Unused SaaS Subscriptions</span>
                                        <Button size="sm" variant="ghost">Audit</Button>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-sm font-medium">Ad Spend Efficiency</span>
                                        <Button size="sm" variant="ghost">Optimize</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </>
            )}
        </div>
    );
}
