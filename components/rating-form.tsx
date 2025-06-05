"use client";

import { useState } from "react"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { submitRating } from "@/app/actions/books"
import { toast } from "sonner"

interface RatingFormProps {
  bookId: string
  initialRating?: number
}

export function RatingForm({ bookId, initialRating }: RatingFormProps) {
  const [rating, setRating] = useState(initialRating || 0)
  const [hoverRating, setHoverRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (rating === 0) {
      toast("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    const result = await submitRating(bookId, rating);
    setIsSubmitting(false);

    if (result.error) {
      toast("Error: " + result.error);
    } else {
      toast("Your rating has been saved");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">Your Rating</h3>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-6 h-6 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={isSubmitting || rating === 0}
        className="w-full"
      >
        {isSubmitting ? "Submitting..." : "Submit Rating"}
      </Button>
    </div>
  )
} 