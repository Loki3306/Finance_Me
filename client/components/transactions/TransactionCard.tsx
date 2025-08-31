import { useState } from "react";
import { formatINR } from "@/lib/inr";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreVertical, 
  Edit, 
  Trash2, 
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  CreditCard,
  Smartphone,
  Banknote,
  Wallet
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface TransactionCardProps {
  transaction: any;
  onEdit?: (transaction: any) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (transaction: any) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'income': return <ArrowUpRight className="text-green-600" size={16} />;
    case 'expense': return <ArrowDownLeft className="text-red-600" size={16} />;
    case 'transfer': return <ArrowLeftRight className="text-blue-600" size={16} />;
    default: return <ArrowDownLeft className="text-gray-600" size={16} />;
  }
};

const getPaymentMethodIcon = (method: string) => {
  if (method?.toLowerCase().includes('upi')) return <Smartphone size={14} />;
  if (method?.toLowerCase().includes('card')) return <CreditCard size={14} />;
  if (method?.toLowerCase().includes('cash')) return <Banknote size={14} />;
  return <Wallet size={14} />;
};

const getCategoryIcon = (category: string) => {
  const cat = category?.toLowerCase() || '';
  if (cat.includes('food')) return '🍽️';
  if (cat.includes('transport')) return '🚗';
  if (cat.includes('shopping')) return '🛍️';
  if (cat.includes('salary')) return '💰';
  if (cat.includes('rent')) return '🏠';
  if (cat.includes('entertainment')) return '🎬';
  if (cat.includes('healthcare')) return '🏥';
  if (cat.includes('education')) return '📚';
  return '💸';
};

export function TransactionCard({ 
  transaction, 
  onEdit, 
  onDelete, 
  onDuplicate,
  isSelected = false,
  onSelect,
  showCheckbox = false
}: TransactionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  const borderColor = transaction.type === 'income' 
    ? 'border-green-500' 
    : transaction.type === 'expense' 
    ? 'border-red-500' 
    : 'border-blue-500';

  const amountColor = transaction.type === 'income' 
    ? 'text-green-600' 
    : transaction.type === 'expense' 
    ? 'text-red-600' 
    : 'text-blue-600';

  const amountPrefix = transaction.type === 'income' 
    ? '+' 
    : transaction.type === 'expense' 
    ? '-' 
    : '';

  const relativeTime = (date: string) => {
    const now = new Date();
    const txDate = new Date(date);
    const diffMs = now.getTime() - txDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return txDate.toLocaleDateString('en-IN');
  };

  return (
    <div
      className={cn(
        "group relative transition-all duration-200 ease-out",
        "transform hover:scale-[1.01] hover:shadow-lg",
        isSelected && "ring-2 ring-primary ring-offset-2"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ transform: `translateX(${swipeOffset}px)` }}
    >
      {/* Mobile Swipe Actions - Left Side (Delete) */}
      {swipeOffset > 0 && (
        <div className="absolute left-0 top-0 h-full bg-red-500 text-white flex items-center justify-center rounded-l-xl w-20">
          <Trash2 size={20} />
        </div>
      )}

      {/* Mobile Swipe Actions - Right Side (Edit) */}
      {swipeOffset < 0 && (
        <div className="absolute right-0 top-0 h-full bg-blue-500 text-white flex items-center justify-center rounded-r-xl w-20">
          <Edit size={20} />
        </div>
      )}

      <div 
        className={cn(
          "relative bg-white dark:bg-gray-800/50 rounded-xl border-l-4 p-4",
          "backdrop-blur-sm border border-gray-200 dark:border-gray-700",
          borderColor,
          "transition-all duration-200",
          isHovered && "shadow-xl transform translate-y-[-2px]"
        )}
      >
        <div className="flex items-start gap-3">
          {/* Checkbox for bulk selection */}
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelect?.(transaction._id, e.target.checked)}
              className="mt-1 rounded border-gray-300"
            />
          )}

          {/* Transaction Icon */}
          <div className="flex-shrink-0 relative">
            <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 grid place-items-center relative overflow-hidden">
              <span className="text-xl">{getCategoryIcon(transaction.category)}</span>
              <div className="absolute bottom-0 right-0 transform translate-x-1 translate-y-1">
                {getTransactionIcon(transaction.type)}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {transaction.description || transaction.category}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {getPaymentMethodIcon(transaction.paymentMethod)}
                    <span className="ml-1">{transaction.category}</span>
                  </Badge>
                  {transaction.subCategory && (
                    <Badge variant="outline" className="text-xs">
                      {transaction.subCategory}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {relativeTime(transaction.date)} • {transaction.paymentMethod || 'Cash'}
                </div>
              </div>

              {/* Amount and Actions */}
              <div className="flex items-start gap-2 ml-3">
                <div className="text-right">
                  <div className={cn("font-bold text-lg", amountColor)}>
                    {amountPrefix}{formatINR(Math.abs(transaction.amount))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Balance: {formatINR(transaction.accountBalance || 0)}
                  </div>
                </div>

                {/* Desktop Actions Menu */}
                <div className={cn(
                  "transition-opacity duration-200",
                  isHovered ? "opacity-100" : "opacity-0"
                )}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit?.(transaction)}>
                        <Edit size={14} className="mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDuplicate?.(transaction)}>
                        <Copy size={14} className="mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => onDelete?.(transaction._id)}
                        className="text-red-600"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Touch Handlers */}
        <div
          className="absolute inset-0 md:hidden"
          onTouchStart={(e) => {
            const touch = e.touches[0];
            (e.currentTarget as any).startX = touch.clientX;
          }}
          onTouchMove={(e) => {
            const touch = e.touches[0];
            const startX = (e.currentTarget as any).startX;
            if (startX) {
              const diffX = touch.clientX - startX;
              setSwipeOffset(Math.max(-80, Math.min(80, diffX)));
            }
          }}
          onTouchEnd={() => {
            if (swipeOffset > 40) {
              onDelete?.(transaction._id);
            } else if (swipeOffset < -40) {
              onEdit?.(transaction);
            }
            setSwipeOffset(0);
          }}
        />
      </div>
    </div>
  );
}
