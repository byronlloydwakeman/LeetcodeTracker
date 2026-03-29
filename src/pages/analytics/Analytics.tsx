import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Container,
  Input,
  Select,
  VStack,
  HStack,
  Table,
  Badge,
  IconButton,
  Heading,
  Text,
  SimpleGrid,
  Card,
  Stat,
  createListCollection,
  Portal
} from '@chakra-ui/react';
import { Dialog } from '@chakra-ui/react';

import { db } from '../../firebase.ts';
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';

interface Problem {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeMinutes: number;
  timeSeconds: number;
  language: string;
  date: string;
  notes: string;
}

interface Stats {
  easy: { avg: number; count: number };
  medium: { avg: number; count: number };
  hard: { avg: number; count: number };
}

const FAANG_TARGETS = {
  easy: 5,
  medium: 15,
  hard: 30,
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'green';
    case 'medium':
      return 'orange';
    case 'hard':
      return 'red';
    default:
      return 'gray';
  }
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });
};

export const Analytics: React.FC<{ userId: string }> = ({ userId }) => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<Stats>({
    easy: { avg: 0, count: 0 },
    medium: { avg: 0, count: 0 },
    hard: { avg: 0, count: 0 },
  });

  const [open, setOpen] = useState(false);

  const [name, setName] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [timeMinutes, setTimeMinutes] = useState(0);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [language, setLanguage] = useState('Python');
  const [notes, setNotes] = useState('');

  const calculateStats = (problems: Problem[]) => {
    const stats: Stats = {
      easy: { avg: 0, count: 0 },
      medium: { avg: 0, count: 0 },
      hard: { avg: 0, count: 0 },
    };

    Object.keys(stats).forEach((difficulty) => {
      const filtered = problems.filter((p) => p.difficulty === difficulty);
      stats[difficulty as keyof Stats].count = filtered.length;
      if (filtered.length > 0) {
        const sum = filtered.reduce((acc, p) => acc + (p.timeMinutes * 60) + p.timeSeconds, 0); // Compute in seconds
        stats[difficulty as keyof Stats].avg = Math.round(sum / filtered.length);
      }
    });

    setStats(stats);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'problems'),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: Problem[] = [];
      snapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data(),
        } as Problem);
      });

      setProblems(docs);
      calculateStats(docs);
    });

    return () => unsubscribe();
  }, [userId]);

  const resetForm = () => {
    setName('');
    setDifficulty('medium');
    setTimeMinutes(0);
    setTimeSeconds(0);
    setLanguage('Python');
    setNotes('');
  }

  const handleAddProblem = async () => {
    if (!name || !timeMinutes) {
      window.alert('Please fill in all fields');
      return;
    }

    try {
      await addDoc(collection(db, 'problems'), {
        userId,
        name: name,
        difficulty: difficulty,
        timeMinutes: timeMinutes,
        timeSeconds: timeSeconds,
        language: language,
        date: new Date().toISOString().split('T')[0],
        notes: notes,
      });

      window.alert('Problem added!');

      resetForm();

      setOpen(false);
    } catch {
      window.alert('Failed to add problem');
    }
  };

  const handleDeleteProblem = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'problems', id));
      window.alert('success');
    } catch {
      window.alert('Failed to delete');
    }
  };

  function formatTime(totalSeconds: number): { minutes: number; seconds: number } {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return { minutes, seconds };
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack gap={6} align="stretch">
        <Box>
          <Heading size="2xl">🎯 Byron's LeetCode Tracker</Heading>
          <Text color="gray.500">
            Track your problem-solving times and prepare for FAANG interviews
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
          {['easy', 'medium', 'hard'].map((difficulty) => {
            const stat = stats[difficulty as keyof Stats];
            const target = FAANG_TARGETS[difficulty as keyof typeof FAANG_TARGETS];
            const isOnTrack = stat.avg != null && stat.avg !== 0 && stat.avg <= target * 60; // As seconds

            return (
              <Card.Root key={difficulty}>
                <Card.Body>
                  <Stat.Root>
                    <Stat.Label>
                      <HStack>
                        <Badge colorPalette={getDifficultyColor(difficulty)}>
                          {difficulty}
                        </Badge>
                        <Text>{stat.count} problems</Text>
                      </HStack>
                    </Stat.Label>

                    <HStack justify="space-between" mt={2}>
                      <Box>
                        <Text fontSize="sm">Current</Text>
                        <Stat.ValueText>
                          {formatTime(stat.avg).minutes || '—'} mins and {formatTime(stat.avg).seconds || '—'} secs
                        </Stat.ValueText>
                      </Box>

                      <Box textAlign="right">
                        <Text fontSize="sm">Target</Text>
                        <Text color={isOnTrack ? 'green.500' : 'red.500'}>
                          {target} min {isOnTrack ? '✅' : '⚠️'}
                        </Text>
                      </Box>
                    </HStack>
                  </Stat.Root>
                </Card.Body>
              </Card.Root>
            );
          })}
        </SimpleGrid>

        <Button colorPalette="blue" size="lg" onClick={() => setOpen(true)}>
          + Add Problem
        </Button>

        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Problem</Table.ColumnHeader>
              <Table.ColumnHeader>Difficulty</Table.ColumnHeader>
              <Table.ColumnHeader>Time</Table.ColumnHeader>
              <Table.ColumnHeader>Language</Table.ColumnHeader>
              <Table.ColumnHeader>Date</Table.ColumnHeader>
              <Table.ColumnHeader></Table.ColumnHeader>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {problems.map((p) => (
              <Table.Row key={p.id}>
                <Table.Cell>{p.name}</Table.Cell>
                <Table.Cell>
                  <Badge colorPalette={getDifficultyColor(p.difficulty)}>
                    {p.difficulty}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{p.timeMinutes} minutes and {p.timeSeconds} seconds</Table.Cell>
                <Table.Cell>{p.language}</Table.Cell>
                <Table.Cell>{formatDate(p.date)}</Table.Cell>
                <Table.Cell>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDeleteProblem(p.id)}
                  >
                    🗑️
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </VStack>

      <Dialog.Root open={open} onOpenChange={(e) => setOpen(e.open)}>
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>Add Problem</Dialog.Header>

            <Dialog.Body>
              <VStack gap={4}>
                <Input
                  placeholder="Problem name"
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value)
                  }
                />

                <DifficultySelector setDifficulty={setDifficulty} />

                <Text mt={2} mb={-3} ml={-400} color="gray.600">Time (min)</Text>
                <Input
                  placeholder="Time (min)"
                  type="number"
                  value={timeMinutes}
                  onChange={(e) =>
                    setTimeMinutes(parseInt(e.target.value))
                  }
                />

                <Text  mt={2} mb={-3} ml={-400} color="gray.600">Time (sec)</Text>
                <Input
                  placeholder="Time (sec)"
                  type="number"
                  value={timeSeconds}
                  onChange={(e) =>
                    setTimeSeconds(parseInt(e.target.value))
                  }
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button colorScheme="blue" onClick={handleAddProblem}>
                Add
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Container>
  );
};

interface DifficultySelectorProps {
    setDifficulty: (difficlty: string) => void;
}
const DifficultySelector = (props: DifficultySelectorProps) => {
    const { setDifficulty } = props;
    // Create a collection for the Select component
    const difficulties: string[] = ["easy", "medium", "hard"];
    const collection = createListCollection({
        items: difficulties.map((diff) => ({
            key: diff,
            value: diff
        }))
    });

    return (
        <Select.Root 
            collection={collection} 
            size="lg"
            width="100%"
            onValueChange={(values) => {
                setDifficulty(values.value[0]);
            }}
        >
            <Select.HiddenSelect />
            <Text mt={2} color="gray.600">Difficulty</Text>
            <Select.Control>
                <Select.Trigger>
                <Select.ValueText placeholder="Select difficulty" />
                </Select.Trigger>
                <Select.IndicatorGroup>
                <Select.Indicator />
                </Select.IndicatorGroup>
            </Select.Control>
            <Portal>
                <Select.Positioner>
                <Select.Content>
                    {difficulties.map((diff) => (
                    <Select.Item item={diff} key={diff}>
                        {diff}
                        <Select.ItemIndicator />
                    </Select.Item>
                    ))}
                </Select.Content>
                </Select.Positioner>
            </Portal>
        </Select.Root>
    );
}

export default Analytics;