"use client"

import * as React from "react"
import { Input } from "@components/ui/input"
import { Label } from "@components/ui/label"
import { cn } from "@lib/utils/cn"

interface TimePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  label?: string
  id?: string
  required?: boolean
  alwaysShowHours?: boolean
}

export const TimePicker: React.FC<TimePickerProps> = ({
  value = "",
  onChange,
  placeholder: _placeholder = "mm:ss",
  className,
  label,
  id,
  required = false,
  alwaysShowHours = false,
}) => {
  const [minutes, setMinutes] = React.useState("")
  const [seconds, setSeconds] = React.useState("")
  const [hours, setHours] = React.useState("")
  const [isLongFormat, setIsLongFormat] = React.useState(false)
  const [hasTypedHours, setHasTypedHours] = React.useState(false)
  const [hasTypedMinutes, setHasTypedMinutes] = React.useState(false)
  const [hasTypedSeconds, setHasTypedSeconds] = React.useState(false)
  const [shouldReplaceHours, setShouldReplaceHours] = React.useState(false)
  const [shouldReplaceMinutes, setShouldReplaceMinutes] = React.useState(false)
  const [shouldReplaceSeconds, setShouldReplaceSeconds] = React.useState(false)

  // Parse the initial value
  React.useEffect(() => {
    if (value) {
      const parts = value.split(":")
      if (parts.length === 2) {
        // mm:ss format - remove leading zeros for display
        setMinutes(String(parseInt(parts[0]) || 0))
        setSeconds(String(parseInt(parts[1]) || 0))
        setHours("")
        setIsLongFormat(false)
      } else if (parts.length === 3) {
        // hh:mm:ss format - remove leading zeros for display
        setHours(String(parseInt(parts[0]) || 0))
        setMinutes(String(parseInt(parts[1]) || 0))
        setSeconds(String(parseInt(parts[2]) || 0))
        setIsLongFormat(true)
      }
    }
  }, [value])

  const updateValue = (h: string, m: string, s: string) => {
    let newValue = ""
    if (alwaysShowHours || h && (parseInt(h) > 0 || isLongFormat)) {
      const hours = h || "0"
      const minutes = m || "0"
      const seconds = s || "0"
      newValue = `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
    } else {
      const minutes = m || "0"
      const seconds = s || "0"
      newValue = `${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`
    }
    onChange?.(newValue)
  }

  const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2)
    
    // If we should replace, use only the new input
    if (shouldReplaceHours) {
      val = val.slice(-1) // Take only the last character typed
      setShouldReplaceHours(false)
    }
    
    setHasTypedHours(true)
    
    if (val === "") {
      setHours("")
      if (alwaysShowHours) setIsLongFormat(true)
      updateValue("", minutes, seconds)
      return
    }
    
    // More permissive during typing - validate on blur instead
    const numVal = parseInt(val)
    if (val.length === 1 || (val.length === 2 && numVal <= 23)) {
      setHours(val)
      if (val || alwaysShowHours) setIsLongFormat(true)
      updateValue(val, minutes, seconds)
    }
  }

  const handleHoursBlur = () => {
    if (hours && hours.length === 1) {
      // Don't auto-pad hours - they can be single digit
      updateValue(hours, minutes, seconds)
    }
  }

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2)
    
    // If we should replace, use only the new input
    if (shouldReplaceMinutes) {
      val = val.slice(-1) // Take only the last character typed
      setShouldReplaceMinutes(false)
    }
    
    setHasTypedMinutes(true)
    
    if (val === "") {
      setMinutes("")
      updateValue(hours, "", seconds)
      return
    }
    
    // More permissive during typing
    const numVal = parseInt(val)
    if (val.length === 1 || (val.length === 2 && numVal <= 59)) {
      setMinutes(val)
      updateValue(hours, val, seconds)
    }
  }

  const handleMinutesBlur = () => {
    if (minutes && minutes.length === 1) {
      // Auto-pad single digit minutes to two digits
      const paddedMinutes = minutes.padStart(2, "0")
      setMinutes(paddedMinutes)
      updateValue(hours, paddedMinutes, seconds)
    }
  }

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2)
    
    // If we should replace, use only the new input
    if (shouldReplaceSeconds) {
      val = val.slice(-1) // Take only the last character typed
      setShouldReplaceSeconds(false)
    }
    
    setHasTypedSeconds(true)
    
    if (val === "") {
      setSeconds("")
      updateValue(hours, minutes, "")
      return
    }
    
    // More permissive during typing
    const numVal = parseInt(val)
    if (val.length === 1 || (val.length === 2 && numVal <= 59)) {
      setSeconds(val)
      updateValue(hours, minutes, val)
    }
  }

  const handleSecondsBlur = () => {
    if (seconds && seconds.length === 1) {
      // Auto-pad single digit seconds to two digits
      const paddedSeconds = seconds.padStart(2, "0")
      setSeconds(paddedSeconds)
      updateValue(hours, minutes, paddedSeconds)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: "hours" | "minutes" | "seconds") => {
    // Handle colon key to move to next field
    if (e.key === ":") {
      e.preventDefault()
      const inputs = document.querySelectorAll(`[data-time-picker="${id}"]`)
      const currentIndex = Array.from(inputs).findIndex(input => input === e.target)
      const nextInput = inputs[currentIndex + 1] as HTMLInputElement
      if (nextInput) {
        nextInput.focus()
        nextInput.select()
      }
      return
    }
    
    // Smart auto-advance logic based on field type and value
    if (e.key >= '0' && e.key <= '9') {
      const currentValue = (e.target as HTMLInputElement).value
      const newValue = currentValue + e.key
      
      // Only auto-advance when it makes logical sense
      const shouldAutoAdvance = () => {
        if (field === "hours") {
          // Only auto-advance if we have 2 digits, or typing 3+ when we have 1 digit (since 30+ hours is invalid)
          const numValue = parseInt(newValue)
          return newValue.length === 2 || (newValue.length === 1 && numValue >= 3)
        } else {
          // For minutes/seconds: only auto-advance when we have 2 digits (more conservative)
          return newValue.length === 2
        }
      }
      
      if (shouldAutoAdvance()) {
        setTimeout(() => {
          const inputs = document.querySelectorAll(`[data-time-picker="${id}"]`)
          const currentIndex = Array.from(inputs).findIndex(input => input === e.target)
          const nextInput = inputs[currentIndex + 1] as HTMLInputElement
          if (nextInput) {
            nextInput.focus()
            nextInput.select()
          }
        }, 10)
      }
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label htmlFor={id} className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {(alwaysShowHours || isLongFormat || hours) && (
            <>
              <Input
                data-time-picker={id}
                type="text"
                inputMode="numeric"
                value={hours}
                onChange={handleHoursChange}
                onBlur={handleHoursBlur}
                onKeyDown={(e) => handleKeyDown(e, "hours")}
                onFocus={(e) => {
                  e.target.select()
                  setShouldReplaceHours(true)
                }}
                placeholder={hasTypedHours ? "" : "00"}
                className="w-12 text-center bg-white/70 dark:bg-zinc-800/70 border-zinc-200/50 dark:border-zinc-700/50 text-zinc-900 dark:text-zinc-100"
                maxLength={2}
              />
              <span className="text-zinc-500 dark:text-zinc-400">:</span>
            </>
          )}
          <Input
            data-time-picker={id}
            type="text"
            inputMode="numeric"
            value={minutes}
            onChange={handleMinutesChange}
            onBlur={handleMinutesBlur}
            onKeyDown={(e) => handleKeyDown(e, "minutes")}
            onFocus={(e) => {
              e.target.select()
              setShouldReplaceMinutes(true)
            }}
            placeholder={hasTypedMinutes ? "" : "00"}
            className="w-12 text-center bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            maxLength={2}
          />
          <span className="text-zinc-500 dark:text-zinc-400">:</span>
          <Input
            data-time-picker={id}
            type="text"
            inputMode="numeric"
            value={seconds}
            onChange={handleSecondsChange}
            onBlur={handleSecondsBlur}
            onKeyDown={(e) => handleKeyDown(e, "seconds")}
            onFocus={(e) => {
              e.target.select()
              setShouldReplaceSeconds(true)
            }}
            placeholder={hasTypedSeconds ? "" : "00"}
            className="w-12 text-center bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
            maxLength={2}
          />
        </div>
        <div className="text-sm text-zinc-500 dark:text-zinc-400">
          {alwaysShowHours || isLongFormat ? "h:mm:ss" : "mm:ss"}
        </div>
      </div>
    </div>
  )
}