import { Button } from "@/components/ui/button";

interface ExercisesPaginationProps {
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
  onPageChange: (page: number) => void;
}

export function ExercisesPagination({
  page,
  totalPages,
  totalElements,
  size,
  onPageChange,
}: ExercisesPaginationProps) {
  const startIndex = totalElements === 0 ? 0 : page * size + 1;
  const endIndex = Math.min((page + 1) * size, totalElements);

  return (
    <div className="flex items-center justify-between text-sm text-slate-600">
      <div>
        Hiển thị{" "}
        <span className="font-medium text-slate-900">{startIndex}</span>
        {" - "}
        <span className="font-medium text-slate-900">{endIndex}</span>
        {" trong tổng số "}
        <span className="font-medium text-slate-900">{totalElements}</span>
        {" bài tập"}
      </div>

      {totalPages > 1 && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(page - 1, 0))}
            disabled={page === 0}
          >
            Trước
          </Button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let pageNum = i;

            if (totalPages > 5) {
              if (page < 2) {
                pageNum = i; // Pages: 0, 1, 2, 3, 4
              } else if (page > totalPages - 3) {
                pageNum = totalPages - 5 + i; // Pages: totalPages-5, ..., totalPages-1
              } else {
                pageNum = page - 2 + i; // Pages: page-2, page-1, page, page+1, page+2
              }
            }

            return (
              <Button
                key={`page-${pageNum}`}
                variant={page === pageNum ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
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
          >
            Tiếp
          </Button>
        </div>
      )}
    </div>
  );
}
