'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
}

const sampleQuestions: Question[] = [
  {
    id: 1,
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2
  },
  {
    id: 2,
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: 1
  },
  // Add more questions as needed
];

export default function Exam() {
  const router = useRouter();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showWarning, setShowWarning] = useState(false);
  const [isCheating, setIsCheating] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    // Simulate cheating detection
    const detectCheating = () => {
      const random = Math.random();
      if (random < 0.1) { // 10% chance of cheating detection
        setIsCheating(true);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      }
    };

    const interval = setInterval(detectCheating, 5000);
    return () => clearInterval(interval);
  }, [router]);

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestion] = optionIndex;
      return newAnswers;
    });
  };

  const handleNext = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score
    const score = answers.reduce((acc, answer, index) => {
      return acc + (answer === sampleQuestions[index].correctAnswer ? 1 : 0);
    }, 0);

    toast({
      title: 'Exam Submitted',
      description: `Your score: ${score}/${sampleQuestions.length}`,
    });

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto"
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Online Exam</h1>
          <motion.div
            className="text-2xl font-mono"
            animate={{
              scale: timeLeft <= 300 ? [1, 1.1, 1] : 1,
              color: timeLeft <= 300 ? '#ef4444' : 'inherit',
            }}
            transition={{ duration: 0.5 }}
          >
            {formatTime(timeLeft)}
          </motion.div>
        </div>

        <AnimatePresence>
          {showWarning && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50"
            >
              <Card className="bg-red-100 border-red-500">
                <CardContent className="p-4">
                  <p className="text-red-700 font-semibold">
                    Warning: Unusual activity detected!
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card>
          <CardHeader>
            <CardTitle>
              Question {currentQuestion + 1} of {sampleQuestions.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <p className="text-lg">{sampleQuestions[currentQuestion].text}</p>
              <div className="space-y-4">
                {sampleQuestions[currentQuestion].options.map((option, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      variant={answers[currentQuestion] === index ? "default" : "outline"}
                      className="w-full justify-start"
                      onClick={() => handleAnswer(index)}
                    >
                      {option}
                    </Button>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </CardContent>
        </Card>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>
          <Button
            onClick={currentQuestion === sampleQuestions.length - 1 ? handleSubmit : handleNext}
          >
            {currentQuestion === sampleQuestions.length - 1 ? 'Submit' : 'Next'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
} 