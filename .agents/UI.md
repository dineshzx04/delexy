{
title: 'S.No',
key: 'sno',
width: 70,
align: 'center',
render: (\_: any, \_\_: any, index: number) => (
<span className="font-mono text-xs text-gray-500 font-medium">
{(currentPage - 1) \* pageSize + index + 1}
</span>
)
}
