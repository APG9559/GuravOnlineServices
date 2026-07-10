import { useState, useEffect } from "react";
import { customersApi } from "@/api";
import { Customer } from "@/types";

/**
 * Hook to search customers by name for autofill suggestions.
 *
 * @param nameValue The current value of the name input field.
 * @returns An object containing suggestions list and a function to clear them.
 */
export function useCustomerNameSearch(nameValue: string | undefined) {
  const [suggestions, setSuggestions] = useState<Customer[]>([]);

  useEffect(() => {
    if (!nameValue || nameValue.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => {
      customersApi
        .getAll({ search: nameValue })
        .then((res) => {
          // Check if response has data array
          const list = Array.isArray(res.data) ? res.data : [];
          // Filter to limit to top 5 suggestions and ensure no exact name matches that are already selected
          const filtered = list.filter(
            (cust) =>
              cust.name.trim().toLowerCase() !== nameValue.trim().toLowerCase(),
          );
          setSuggestions(filtered.slice(0, 5));
        })
        .catch(() => {});
    }, 600); // 500ms debounce

    return () => clearTimeout(timer);
  }, [nameValue]);

  return { suggestions, setSuggestions };
}
