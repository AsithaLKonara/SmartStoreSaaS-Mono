'use client';
import React, { useState } from 'react';
import { SearchQuery } from '@/lib/search';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Search, X, Filter } from 'lucide-react';

interface AdvancedSearchProps {
  entityType: string;
  onSearch: (query: SearchQuery) => void;
  onReset: () => void;
  placeholder: string;
}

export function AdvancedSearch({ entityType, onSearch, onReset, placeholder }: AdvancedSearchProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = () => {
    const query: SearchQuery = {
      term: searchTerm,
      filters: {},
      page: 1,
      limit: 20
    };
    onSearch(query);
  };

  const handleReset = () => {
    setSearchTerm('');
    setShowFilters(false);
    onReset();
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <Button onClick={handleSearch} variant="default">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        <Button onClick={() => setShowFilters(!showFilters)} variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        {searchTerm && (
          <Button onClick={handleReset} variant="ghost">
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Advanced Filters for {entityType}</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Date Range</label>
              <Input type="date" placeholder="From date" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <Input type="date" placeholder="To date" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <Input placeholder="Filter by status" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button onClick={handleSearch} size="sm">Apply Filters</Button>
            <Button onClick={handleReset} size="sm" variant="outline">Reset</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
