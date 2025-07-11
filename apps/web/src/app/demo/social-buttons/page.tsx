"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@components/ui/card";
import { Button, Input } from "@components/ui";
import { Heart, MessageCircle } from "lucide-react";

export default function SocialButtonsDemo() {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(3);
  const [commentOpen, setCommentOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    setCommentOpen(!commentOpen);
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      setComments(prev => [...prev, commentText]);
      setCommentCount(prev => prev + 1);
      setCommentText("");
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="container mx-auto px-6 py-8 max-w-2xl">
        
        {/* Header Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
            Social Buttons Demo
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Testing the fixed positioning of like and comment buttons
          </p>
        </div>

        {/* Demo Post Card */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl text-zinc-900 dark:text-zinc-100">
              Demo Run Post
            </CardTitle>
            <CardDescription className="text-zinc-600 dark:text-zinc-400">
              Click the comment button to test if the like button stays in place
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Mock Run Data */}
            <div className="inline-flex items-center gap-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">5.2</span>
                <span className="text-xs text-zinc-600 dark:text-zinc-400">mi</span>
              </div>
              <div className="w-px h-4 bg-zinc-300 dark:bg-zinc-600"></div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">42:15</span>
              </div>
            </div>

            <p className="text-zinc-700 dark:text-zinc-300">
              Great morning run! Perfect weather and felt really strong throughout. 
              The new training plan is definitely paying off. 🏃‍♂️
            </p>

            {/* Action Buttons - Fixed Position Layout */}
            <div>
              <div className="flex items-center gap-4 mb-3">
                <Button
                  size="sm"
                  variant={liked ? "secondary" : "outline"}
                  onClick={handleLike}
                  className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 bg-transparent transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-0 border border-zinc-300 dark:border-zinc-700"
                >
                  <Heart className={`w-4 h-4 ${liked ? "fill-current text-red-500" : ""}`} />
                  {likeCount}
                </Button>
                
                <Button
                  size="sm"
                  variant={commentOpen ? "secondary" : "outline"}
                  onClick={handleComment}
                  className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300 bg-transparent transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:ring-0 border border-zinc-300 dark:border-zinc-700"
                >
                  <MessageCircle className="w-4 h-4" />
                  {commentCount}
                </Button>
              </div>
              
              {/* Comment Section - Appears Below Buttons */}
              {commentOpen && (
                <div className="mt-3 space-y-3">
                  {comments.map((comment, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-zinc-900 dark:text-zinc-100">
                      <div className="w-6 h-6 bg-zinc-300 dark:bg-zinc-700 rounded-full flex-shrink-0"></div>
                      <p><span className="font-semibold">demo_user</span> {comment}</p>
                    </div>
                  ))}
                  
                  <div className="flex gap-2">
                    <Input
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment"
                      className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    <Button
                      size="sm"
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                      className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                    >
                      Post
                    </Button>
                  </div>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Instructions */}
        <Card className="bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm mt-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-3">
              Testing Instructions
            </h3>
            <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400 list-decimal list-inside">
              <li>Note the position of the "❤️ 3" like button</li>
              <li>Click the "💬 0" comment button to expand the comment section</li>
              <li>Observe that the like button stays in the exact same position</li>
              <li>The comment input form appears below the buttons, not displacing them</li>
              <li>Click the comment button again to collapse and verify consistency</li>
            </ol>
            
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-700 dark:text-green-400 text-sm font-medium">
                ✅ Fixed: Like and comment buttons now maintain their position when the comment section expands
              </p>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}