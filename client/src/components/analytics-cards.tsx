import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Analytics, SearchResult } from "@/lib/types";

interface AnalyticsCardsProps {
  searchResults?: SearchResult | null;
}

export default function AnalyticsCards({ searchResults }: AnalyticsCardsProps) {
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!analytics && !searchResults) {
    return null;
  }

  const cards = [
    {
      title: "Total Leads",
      value: searchResults?.totalResults || analytics?.totalLeads || 0,
      icon: "fas fa-users",
      iconColor: "text-primary",
      bgColor: "bg-blue-100",
      change: analytics ? "+12.5%" : null,
      changeType: "increase" as const,
    },
    {
      title: "Verified Emails",
      value: searchResults?.verifiedEmails || analytics?.verifiedEmails || 0,
      icon: "fas fa-envelope-circle-check",
      iconColor: "text-green-600",
      bgColor: "bg-green-100",
      subtitle: analytics ? `${analytics.verificationRate.toFixed(1)}% success rate` : 
                searchResults ? `${((searchResults.verifiedEmails / searchResults.totalResults) * 100).toFixed(1)}% success rate` : null,
    },
    {
      title: "API Calls Used",
      value: searchResults?.apiCallsUsed || analytics?.totalApiCalls || 0,
      icon: "fas fa-bolt",
      iconColor: "text-orange-600",
      bgColor: "bg-orange-100",
      subtitle: analytics ? `${analytics.remainingCalls} remaining` : null,
    },
    {
      title: "Search Time",
      value: searchResults ? `${(searchResults.searchTime / 1000).toFixed(1)}s` : 
             analytics ? `${(analytics.avgSearchTime / 1000).toFixed(1)}s` : "N/A",
      icon: "fas fa-clock",
      iconColor: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "30% faster",
      changeType: "increase" as const,
      subtitle: !searchResults ? "Average time" : null,
    },
  ];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                <i className={`${card.icon} ${card.iconColor} text-xl`}></i>
              </div>
            </div>
            <div className="mt-4">
              {card.change && (
                <>
                  <span className={`text-sm ${card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                    {card.changeType === 'increase' ? '↗' : '↘'} {card.change}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">vs last search</span>
                </>
              )}
              {card.subtitle && !card.change && (
                <span className="text-sm text-gray-600">{card.subtitle}</span>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
