"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getAllPrograms, getAllProgramTags } from "@/services/program/program.service";
import type {
  ProgramItem,
  ProgramListParams,
  ProgramSortBy,
  ProgramSortConfig,
  ProgramStatus,
} from "@/types/program/program.types";
import {
  getProgramErrorMessage,
  isCanceledProgramRequest,
  mapProgramToItem,
  PROGRAM_ITEMS_PER_PAGE,
} from "@/utils/program/program.utils";

export function usePrograms() {
  const [programs, setPrograms] = useState<ProgramItem[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStatus, setSelectedStatusValue] = useState<"" | ProgramStatus>("");
  const [selectedTag, setSelectedTagValue] = useState("");
  const [currentPage, setCurrentPageValue] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortConfig, setSortConfig] = useState<ProgramSortConfig>({
    key: "created_at",
    direction: "desc",
  });
  const requestIdRef = useRef(0);

  const allTags = useMemo(
    () => Array.from(new Set([...availableTags, ...programs.flatMap((program) => program.tags)])),
    [availableTags, programs],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setCurrentPageValue(1);
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [search]);

  const loadTags = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await getAllProgramTags(signal);
      if (response.success) setAvailableTags(response.data);
    } catch (loadError: unknown) {
      if (!isCanceledProgramRequest(loadError)) {
        console.error("Failed to load program tags:", loadError);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadTags(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadTags]);

  const loadPrograms = useCallback(
    async (signal?: AbortSignal, silent?: boolean) => {
      const requestId = ++requestIdRef.current;
      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const params: ProgramListParams = {
          page: currentPage,
          limit: PROGRAM_ITEMS_PER_PAGE,
          sortBy: sortConfig.key,
          sortOrder: sortConfig.direction === "asc" ? "ASC" : "DESC",
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(selectedStatus ? { status: selectedStatus } : {}),
          ...(selectedTag ? { tag: selectedTag } : {}),
        };
        const response = await getAllPrograms(params, signal);

        if (requestId !== requestIdRef.current) return;

        if (!response.success) {
          setError(response.message || "Failed to load programs.");
          return;
        }

        const total =
          response.pagination?.totalRecords ??
          response.pagination?.total ??
          response.data.length;
        const pages =
          response.pagination?.totalPages ??
          Math.max(1, Math.ceil(total / PROGRAM_ITEMS_PER_PAGE));

        setPrograms(response.data.map(mapProgramToItem));
        setTotalRecords(total);
        setTotalPages(Math.max(1, pages));
      } catch (loadError: unknown) {
        if (requestId === requestIdRef.current && !isCanceledProgramRequest(loadError)) {
          console.error("Failed to load programs:", loadError);
          setError(getProgramErrorMessage(loadError, "Failed to load programs."));
        }
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    },
    [currentPage, debouncedSearch, selectedStatus, selectedTag, sortConfig],
  );

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      void loadPrograms(controller.signal);
    }, 0);
    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [loadPrograms]);

  const setSearch = useCallback((value: string) => setSearchValue(value), []);
  const setSelectedStatus = useCallback((value: "" | ProgramStatus) => {
    setSelectedStatusValue(value);
    setCurrentPageValue(1);
  }, []);
  const setSelectedTag = useCallback((value: string) => {
    setSelectedTagValue(value);
    setCurrentPageValue(1);
  }, []);
  const setCurrentPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) setCurrentPageValue(page);
    },
    [totalPages],
  );
  const setSort = useCallback((key: ProgramSortBy) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
    setCurrentPageValue(1);
  }, []);

  return {
    programs,
    setPrograms,
    allTags,
    isLoading,
    error,
    search,
    selectedStatus,
    selectedTag,
    currentPage,
    totalPages,
    totalRecords,
    sortConfig,
    setSearch,
    setSelectedStatus,
    setSelectedTag,
    setCurrentPage,
    setSort,
    reloadPrograms: loadPrograms,
    reloadTags: loadTags,
  };
}
