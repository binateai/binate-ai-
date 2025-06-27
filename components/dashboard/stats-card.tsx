import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { Mail, CalendarDays, CheckSquare, Receipt } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: number;
  icon: string;
  color: string;
  action: string;
  actionLink: string;
  isMonetary?: boolean;
};

export default function StatsCard({
  title,
  value,
  icon,
  color,
  action,
  actionLink,
  isMonetary = false,
}: StatsCardProps) {
  const getIconByType = () => {
    switch (icon) {
      case "email":
        return <Mail className={`text-${color}-500`} />;
      case "event":
        return <CalendarDays className={`text-${color}-500`} />;
      case "task":
        return <CheckSquare className={`text-${color}-500`} />;
      case "receipt":
        return <Receipt className={`text-${color}-500`} />;
      default:
        return <Mail className={`text-${color}-500`} />;
    }
  };

  const displayValue = isMonetary ? formatCurrency(value) : value;

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="p-5">
          <div className="flex items-center">
            <div className={`flex-shrink-0 p-3 rounded-md bg-${color}-500/10`}>
              {getIconByType()}
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-muted-foreground truncate">
                  {title}
                </dt>
                <dd>
                  <div className="text-lg font-medium">{displayValue}</div>
                </dd>
              </dl>
            </div>
          </div>
        </div>
        <div className="bg-muted/50 px-5 py-3">
          <div className="text-sm">
            <Link href={actionLink} className="font-medium text-primary hover:underline">
              {action}
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
