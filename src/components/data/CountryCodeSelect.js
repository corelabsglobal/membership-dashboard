"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

export function CountryCodeSelect({ value, onChange, countryCodes }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredCountries, setFilteredCountries] = useState(countryCodes)

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredCountries(countryCodes)
    } else {
      const filtered = countryCodes.filter((country) => 
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchTerm, countryCodes])

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[250px]">
        <SelectValue placeholder="Select country" />
      </SelectTrigger>
      <SelectContent>
        <div className="p-2">
          <Input
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </div>
        {filteredCountries.map((country) => (
          <SelectItem key={country.code} value={country.code}>
            {country.code} {country.name}
          </SelectItem>
        ))}
        {filteredCountries.length === 0 && (
          <div className="py-2 text-center text-sm text-gray-500">
            No countries found
          </div>
        )}
      </SelectContent>
    </Select>
  )
}