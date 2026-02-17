import { Button } from "@/components/ui/button";

interface UserPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  filteredCount: number;
  onPageChange: (page: number) => void;
}

export function UserPagination({
  page,
  totalPages,
  totalElements,
  size,
  filteredCount,
  onPageChange,
}: UserPaginationProps) {
  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <div>
        Hiển thị{" "}
        <span className="font-medium text-slate-900">
          {totalElements === 0 ? 0 : page * size + 1}
        </span>
        {" - "}
        <span className="font-medium text-slate-900">
          {Math.min((page + 1) * size, totalElements)}
        </span>
        {" trong tổng số "}
        <span className="font-medium text-slate-900">{totalElements}</span>
        {" người dùng"}
        {filteredCount < totalElements && (
          <>
            {" ("}
            <span className="font-medium text-slate-900">{filteredCount}</span>
            {" kết quả lọc)"}
          </>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(page - 1, 0))}
            disabled={page === 0}
            className="hover:bg-slate-100 transition-colors"
          >
            Trước
          </Button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum = i;
            if (totalPages > 5) {
              if (page < 3) pageNum = i;
              else if (page > totalPages - 3) pageNum = totalPages - 5 + i;
              else pageNum = page - 2 + i;
            }
            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className={
                  page === pageNum
                    ? "bg-slate-900 hover:bg-slate-800"
                    : "hover:bg-slate-100 transition-colors"
                }
              >
                {pageNum + 1}
              </Button>
            );
          })}

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(page + 1, totalPages - 1))}
            disabled={page === totalPages - 1}
            className="hover:bg-slate-100 transition-colors"
          >
            Tiếp
          </Button>
        </div>
      )}
    </div>
  );
}
