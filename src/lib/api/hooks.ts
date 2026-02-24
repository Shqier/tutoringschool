// ============================================
// BUSALA API HOOKS
// Custom React hooks for data fetching
// Updated for busala-sync.json v0.5 contract
// ============================================

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiClientError, ApiConflictError } from './client';
import * as api from './client';
import type {
  LessonsQuery,
  LessonsResponse,
  TeachersQuery,
  TeachersResponse,
  Teacher,
  GroupsQuery,
  GroupsResponse,
  GroupDetailResponse,
  StudentsQuery,
  StudentsResponse,
  Student,
  RoomsQuery,
  RoomsResponse,
  ApprovalsQuery,
  ApprovalsResponse,
  SchedulingQuery,
  SchedulingResponse,
  CreateLessonInput,
  UpdateLessonInput,
  UpdateStudentInput,
} from './types';

// ============================================
// GENERIC FETCH HOOK
// ============================================

interface UseQueryResult<T> {
  data: T | null;
  isLoading: boolean;
  error: ApiClientError | null;
  refetch: () => void;
}

function useQuery<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  deps: unknown[] = []
): UseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiClientError | null>(null);
  const mountedRef = useRef(true);

  const fetch = useCallback(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchFn(controller.signal)
      .then((result) => {
        if (mountedRef.current) {
          setData(result);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mountedRef.current && err.name !== 'AbortError') {
          setError(
            err instanceof ApiClientError
              ? err
              : new ApiClientError({
                  code: 'UNKNOWN_ERROR',
                  message: err.message || 'An error occurred',
                })
          );
          setIsLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    mountedRef.current = true;
    const cleanup = fetch();
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, [fetch]);

  return { data, isLoading, error, refetch: fetch };
}

// ============================================
// MUTATION HOOK
// ============================================

interface UseMutationResult<TInput, TOutput> {
  mutate: (input: TInput) => Promise<TOutput>;
  isLoading: boolean;
  error: ApiClientError | ApiConflictError | null;
  reset: () => void;
}

function useMutation<TInput, TOutput>(
  mutationFn: (input: TInput, signal: AbortSignal) => Promise<TOutput>
): UseMutationResult<TInput, TOutput> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiClientError | ApiConflictError | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (input: TInput): Promise<TOutput> => {
      // Cancel any in-flight request
      controllerRef.current?.abort();
      controllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(input, controllerRef.current.signal);
        setIsLoading(false);
        return result;
      } catch (err) {
        const apiError =
          err instanceof ApiClientError || err instanceof ApiConflictError
            ? err
            : new ApiClientError({
                code: 'UNKNOWN_ERROR',
                message: (err as Error).message || 'An error occurred',
              });
        setError(apiError);
        setIsLoading(false);
        throw apiError;
      }
    },
    [mutationFn]
  );

  const reset = useCallback(() => {
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      controllerRef.current?.abort();
    };
  }, []);

  return { mutate, isLoading, error, reset };
}

// ============================================
// NORMALIZED RESPONSE TYPES
// These match what pages expect (consistent with old mock data structure)
// ============================================

interface NormalizedLessonsResponse {
  lessons: LessonsResponse['data'];
  total: number;
}

interface NormalizedTeachersResponse {
  teachers: TeachersResponse['data'];
  total: number;
}

interface NormalizedGroupsResponse {
  groups: GroupsResponse['data'];
  total: number;
}

interface NormalizedStudentsResponse {
  students: StudentsResponse['data'];
  total: number;
}

interface NormalizedRoomsResponse {
  rooms: RoomsResponse['data'];
  total: number;
}

interface NormalizedApprovalsResponse {
  approvals: ApprovalsResponse['data'];
  total: number;
  counts: ApprovalsResponse['counts'];
}

// ============================================
// SPECIFIC HOOKS
// ============================================

// Lessons
export function useLessons(query?: LessonsQuery) {
  const result = useQuery<LessonsResponse>(
    (signal) => api.getLessons(query, signal),
    [JSON.stringify(query)]
  );

  // Normalize the response
  const normalizedData: NormalizedLessonsResponse | null = result.data
    ? {
        lessons: result.data.data,
        total: result.data.pagination.total,
      }
    : null;

  return { ...result, data: normalizedData };
}

export function useCreateLesson() {
  return useMutation(
    (
      input: CreateLessonInput & { forceCreate?: boolean },
      signal: AbortSignal
    ) =>
      api.createLesson(
        input,
        { signal, forceCreate: input.forceCreate }
      )
  );
}

export function useUpdateLesson() {
  return useMutation(
    (
      params: {
        id: string;
        input: UpdateLessonInput;
        forceUpdate?: boolean;
      },
      signal: AbortSignal
    ) => api.updateLesson(params.id, params.input, { signal, forceUpdate: params.forceUpdate })
  );
}

export function useDeleteLesson() {
  return useMutation((id: string, signal: AbortSignal) => api.deleteLesson(id, signal));
}

// Teachers
export function useTeachers(query?: TeachersQuery) {
  const result = useQuery<TeachersResponse>(
    (signal) => api.getTeachers(query, signal),
    [JSON.stringify(query)]
  );

  const normalizedData: NormalizedTeachersResponse | null = result.data
    ? {
        teachers: result.data.data,
        total: result.data.pagination.total,
      }
    : null;

  return { ...result, data: normalizedData };
}

export function useTeacher(id: string | null) {
  return useQuery<Teacher>(
    (signal) => {
      if (!id) return Promise.reject(new Error('No ID provided'));
      return api.getTeacher(id, signal);
    },
    [id]
  );
}

export function useCreateTeacher() {
  return useMutation(api.createTeacher);
}

export function useUpdateTeacher() {
  return useMutation(
    (params: { id: string; input: Parameters<typeof api.updateTeacher>[1] }, signal: AbortSignal) =>
      api.updateTeacher(params.id, params.input, signal)
  );
}

export function useDeleteTeacher() {
  return useMutation((id: string, signal: AbortSignal) => api.deleteTeacher(id, signal));
}

// Groups
export function useGroups(query?: GroupsQuery) {
  const result = useQuery<GroupsResponse>(
    (signal) => api.getGroups(query, signal),
    [JSON.stringify(query)]
  );

  const normalizedData: NormalizedGroupsResponse | null = result.data
    ? {
        groups: result.data.data,
        total: result.data.pagination.total,
      }
    : null;

  return { ...result, data: normalizedData };
}

export function useGroup(id: string | null) {
  return useQuery<GroupDetailResponse>(
    (signal) => {
      if (!id) return Promise.reject(new Error('No ID provided'));
      return api.getGroup(id, signal);
    },
    [id]
  );
}

export function useCreateGroup() {
  return useMutation(api.createGroup);
}

export function useUpdateGroup() {
  return useMutation(
    (params: { id: string; input: Parameters<typeof api.updateGroup>[1] }, signal: AbortSignal) =>
      api.updateGroup(params.id, params.input, signal)
  );
}

export function useAssignStudents() {
  return useMutation(
    (params: { id: string; studentIds: string[] }, signal: AbortSignal) =>
      api.assignStudentsToGroup(params.id, { studentIds: params.studentIds }, signal)
  );
}

export function useDeleteGroup() {
  return useMutation((id: string, signal: AbortSignal) => api.deleteGroup(id, signal));
}

// Students
export function useStudents(query?: StudentsQuery) {
  const result = useQuery<StudentsResponse>(
    (signal) => api.getStudents(query, signal),
    [JSON.stringify(query)]
  );

  const normalizedData: NormalizedStudentsResponse | null = result.data
    ? {
        students: result.data.data,
        total: result.data.pagination.total,
      }
    : null;

  return { ...result, data: normalizedData };
}

export function useStudent(id: string | null) {
  return useQuery<Student>(
    (signal) => {
      if (!id) return Promise.reject(new Error('No ID provided'));
      return api.getStudent(id, signal);
    },
    [id]
  );
}

export function useCreateStudent() {
  return useMutation(api.createStudent);
}

export function useUpdateStudent() {
  return useMutation(
    (params: { id: string; input: UpdateStudentInput }, signal: AbortSignal) =>
      api.updateStudent(params.id, params.input, signal)
  );
}

export function useDeleteStudent() {
  return useMutation((id: string, signal: AbortSignal) => api.deleteStudent(id, signal));
}

// Rooms
export function useRooms(query?: RoomsQuery) {
  const result = useQuery<RoomsResponse>(
    (signal) => api.getRooms(query, signal),
    [JSON.stringify(query)]
  );

  const normalizedData: NormalizedRoomsResponse | null = result.data
    ? {
        rooms: result.data.data,
        total: result.data.pagination.total,
      }
    : null;

  return { ...result, data: normalizedData };
}

export function useCreateRoom() {
  return useMutation(api.createRoom);
}

export function useUpdateRoom() {
  return useMutation(
    (params: { id: string; input: Parameters<typeof api.updateRoom>[1] }, signal: AbortSignal) =>
      api.updateRoom(params.id, params.input, signal)
  );
}

export function useDeleteRoom() {
  return useMutation((id: string, signal: AbortSignal) => api.deleteRoom(id, signal));
}

// Approvals
export function useApprovals(query?: ApprovalsQuery) {
  const result = useQuery<ApprovalsResponse>(
    (signal) => api.getApprovals(query, signal),
    [JSON.stringify(query)]
  );

  const normalizedData: NormalizedApprovalsResponse | null = result.data
    ? {
        approvals: result.data.data,
        total: result.data.pagination.total,
        counts: result.data.counts,
      }
    : null;

  return { ...result, data: normalizedData };
}

export function useApproveApproval() {
  return useMutation(
    (params: { id: string; reviewerNote?: string }, signal: AbortSignal) =>
      api.approveApproval(params.id, params.reviewerNote, signal)
  );
}

export function useRejectApproval() {
  return useMutation(
    (params: { id: string; reviewerNote?: string }, signal: AbortSignal) =>
      api.rejectApproval(params.id, params.reviewerNote, signal)
  );
}

// Scheduling
export function useScheduling(query?: SchedulingQuery) {
  return useQuery<SchedulingResponse>(
    (signal) => api.getScheduling(query, signal),
    [JSON.stringify(query)]
  );
}
