import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Modal, Button, Input } from 'antd';
import * as Lucide from 'lucide-react';
import { cn } from '../../lib/utils';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../data/db';

interface CategoryPickerProps {
  value?: string; // Category ID
  onChange?: (categoryId: string, categoryName: string) => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ value, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch categories from Dexie
  const dbCategories = useLiveQuery(() => db.categories.toArray()) || [];

  // State to hold the selected path of category IDs
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Compute columns based on selected path
  const columns = useMemo(() => {
    // First column is always roots (where parentId is null)
    const cols = [dbCategories.filter(c => c.parentId === null)];

    // For each selected item in the path, if it has children, add the next column
    for (let i = 0; i < selectedPath.length; i++) {
      const currentId = selectedPath[i];
      const children = dbCategories.filter(c => c.parentId === currentId);
      if (children.length > 0) {
        cols.push(children);
      }
    }
    return cols;
  }, [selectedPath, dbCategories]);

  // Handle Search Filtering
  // If search query exists, we flatten the UI to just show search results instead of columns
  const searchResults = useMemo(() => {
    if (!searchQuery) return [];
    return dbCategories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || (c.slug && c.slug.toLowerCase().includes(searchQuery.toLowerCase()))).slice(0, 50); // limit for performance
  }, [searchQuery, dbCategories]);

  const handleSelectCategory = (categoryId: string, columnIndex: number) => {
    // Truncate path to current column, then append new selection
    const newPath = selectedPath.slice(0, columnIndex);
    newPath.push(categoryId);
    setSelectedPath(newPath);
  };

  const handleConfirm = () => {
    if (selectedPath.length > 0) {
      const finalId = selectedPath[selectedPath.length - 1];
      const finalCat = dbCategories.find(c => c.id === finalId);
      if (finalCat && onChange) {
        onChange(finalCat.id, finalCat.name);
      }
    }
    setIsModalOpen(false);
  };

  const handleClear = () => {
    setSelectedPath([]);
    if (onChange) onChange('', '');
  };

  // Auto-scroll to the rightmost column when a new one is added
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        left: scrollContainerRef.current.scrollWidth,
        behavior: 'smooth'
      });
    }
  }, [columns.length]);

  // Find currently selected category path for the trigger button
  const currentCategoryPathNames = useMemo(() => {
    if (!value || dbCategories.length === 0) return null;
    const pathNames: string[] = [];
    let curr = dbCategories.find(c => c.id === value);
    while (curr) {
      pathNames.unshift(curr.name);
      curr = dbCategories.find(c => c.id === curr!.parentId);
    }
    return pathNames.length > 0 ? pathNames : null;
  }, [value, dbCategories]);

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          onClick={() => {
            // Re-hydrate path if editing existing value
            if (value && dbCategories.length > 0) {
              const path: string[] = [];
              let curr = dbCategories.find(c => c.id === value);
              while (curr) {
                path.unshift(curr.id);
                curr = dbCategories.find(c => c.id === curr!.parentId);
              }
              setSelectedPath(path);
            } else {
              setSelectedPath([]);
            }
            setIsModalOpen(true);
          }}
          className={cn(
            "flex-1 flex justify-between items-center h-10 px-3 border border-gray-300 rounded shadow-sm hover:border-sky-500 overflow-hidden",
            currentCategoryPathNames ? "text-gray-900" : "text-gray-400"
          )}
        >
          <div className="flex items-center gap-1.5 truncate">
            {!currentCategoryPathNames ? (
              <span className="truncate">Browse and select a category...</span>
            ) : (
              currentCategoryPathNames.map((name, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <Lucide.ChevronRight size={14} className="text-gray-400 shrink-0" />}
                  <span className={idx === currentCategoryPathNames.length - 1 ? "font-semibold truncate" : "text-gray-600 truncate"}>
                    {name}
                  </span>
                </React.Fragment>
              ))
            )}
          </div>
          <Lucide.ChevronDown size={16} className="text-gray-400 shrink-0 ml-2" />
        </Button>
        {currentCategoryPathNames && (
          <Button type="text" danger onClick={handleClear} icon={<Lucide.X size={16} />} />
        )}
      </div>

      <Modal
        title="Category Browser"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={900}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            className="bg-sky-600"
            disabled={selectedPath.length === 0}
            onClick={handleConfirm}
          >
            Confirm Selection
          </Button>
        ]}
        bodyStyle={{ padding: 0 }}
        destroyOnClose
      >
        <div className="flex flex-col h-[500px] bg-gray-50">

          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 bg-white">
            <Input
              prefix={<Lucide.Search size={16} className="text-gray-400" />}
              placeholder="Search specific categories..."
              size="large"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              allowClear
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-hidden relative">
            {searchQuery ? (
              // Search Results View
              <div className="absolute inset-0 overflow-auto bg-white p-2">
                {searchResults.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-gray-400">No categories found.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {searchResults.map(cat => (
                      <div
                        key={cat.id}
                        className="p-3 border border-gray-100 rounded hover:border-sky-500 cursor-pointer flex items-center justify-between transition-colors"
                        onClick={() => {
                          // Build path for this category so when we clear search, we are deep in the tree
                          const path: string[] = [];
                          let curr: any = cat;
                          while (curr) {
                            path.unshift(curr.id);
                            curr = dbCategories.find(c => c.id === curr!.parentId);
                          }
                          setSelectedPath(path);
                          setSearchQuery('');
                        }}
                      >
                        <span className="font-medium text-gray-700">{cat.name}</span>
                        <Lucide.ArrowRight size={14} className="text-sky-500" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              // Mac OS Miller Columns View
              <div
                ref={scrollContainerRef}
                className="absolute inset-0 flex overflow-x-auto bg-gray-100 p-2 gap-2 snap-x snap-mandatory"
              >
                {columns.map((colItems, colIndex) => (
                  <div
                    key={colIndex}
                    className="flex-shrink-0 w-64 bg-white border border-gray-200 rounded-md overflow-hidden flex flex-col shadow-sm snap-start"
                  >
                    <div className="p-2 border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Level {colIndex + 1}
                    </div>
                    <div className="flex-1 overflow-y-auto p-1">
                      {colItems.map(item => {
                        const isSelected = selectedPath[colIndex] === item.id;
                        const hasChildren = dbCategories.some(c => c.parentId === item.id);
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "px-3 py-2 text-sm rounded cursor-pointer flex items-center justify-between mb-1",
                              isSelected ? "bg-sky-600 text-white" : "hover:bg-gray-100 text-gray-700"
                            )}
                            onClick={() => handleSelectCategory(item.id, colIndex)}
                          >
                            <span className="truncate pr-2">{item.name}</span>
                            {hasChildren && (
                              <Lucide.ChevronRight size={14} className={isSelected ? "text-sky-200" : "text-gray-400"} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Breadcrumb Footer */}
          <div className="p-3 border-t border-gray-200 bg-white text-sm text-gray-600 flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <Lucide.FolderTree size={16} className="text-gray-400 shrink-0" />
            {selectedPath.length === 0 ? (
              <span className="italic text-gray-400">No category selected</span>
            ) : (
              selectedPath.map((id, idx) => {
                const cat = dbCategories.find(c => c.id === id);
                return (
                  <React.Fragment key={id}>
                    {idx > 0 && <Lucide.ChevronRight size={12} className="text-gray-300 shrink-0" />}
                    <span className={idx === selectedPath.length - 1 ? "font-semibold text-gray-900" : ""}>
                      {cat?.name}
                    </span>
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CategoryPicker;
