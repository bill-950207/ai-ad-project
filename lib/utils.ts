/**
 * 유틸리티 함수
 *
 * 애플리케이션 전역에서 사용되는 유틸리티 함수들을 제공합니다.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 클래스명 병합 유틸리티
 *
 * Tailwind CSS 클래스들을 병합하고 충돌을 해결합니다.
 * clsx로 조건부 클래스를 처리하고, tailwind-merge로 충돌하는 클래스를 병합합니다.
 *
 * @param inputs - 병합할 클래스명 배열
 * @returns 병합된 클래스명 문자열
 *
 * @example
 * cn('px-2 py-1', 'px-4') // 'py-1 px-4' (px-4가 px-2를 덮어씀)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
