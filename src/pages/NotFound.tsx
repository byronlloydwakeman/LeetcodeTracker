import { Box, Heading, Text,  } from "@chakra-ui/react";

export default function NotFound() {
  return (
    <Box textAlign="center" mt={20}>
      <Heading>404</Heading>
      <Text mt={4}>Page not found.</Text>
    </Box>
  );
}
