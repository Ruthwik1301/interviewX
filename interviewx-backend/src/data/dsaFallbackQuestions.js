/**
 * Pre-built structured DSA questions used as fallback when Groq is unavailable.
 * Each question matches the exact schema returned by generateDSAQuestions.
 * Questions are randomised on every call so each session feels different.
 */

const DSA_POOL = [
  {
    title: "Two Sum",
    description:
      "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
    difficulty: "Easy",
    tags: ["Array", "Hash Table"],
    companies: ["Google", "Amazon", "Meta"],
    examples: [
      {
        input: "nums = [2,7,11,15], target = 9",
        output: "[0,1]",
        explanation: "nums[0] + nums[1] = 2 + 7 = 9, so we return [0, 1].",
      },
      {
        input: "nums = [3,2,4], target = 6",
        output: "[1,2]",
        explanation: "nums[1] + nums[2] = 2 + 4 = 6, so we return [1, 2].",
      },
    ],
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists.",
    ],
  },
  {
    title: "Reverse a Linked List",
    description:
      "Given the head of a singly linked list, reverse the list, and return the reversed list.",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
    companies: ["Microsoft", "Amazon", "Adobe"],
    examples: [
      {
        input: "head = [1,2,3,4,5]",
        output: "[5,4,3,2,1]",
        explanation: "The list is reversed from 1→2→3→4→5 to 5→4→3→2→1.",
      },
      {
        input: "head = [1,2]",
        output: "[2,1]",
        explanation: "Two-node list reversed.",
      },
    ],
    constraints: [
      "The number of nodes in the list is in the range [0, 5000].",
      "-5000 <= Node.val <= 5000",
    ],
  },
  {
    title: "Valid Parentheses",
    description:
      "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    difficulty: "Easy",
    tags: ["Stack", "String"],
    companies: ["Google", "Facebook", "Bloomberg"],
    examples: [
      {
        input: 's = "()"',
        output: "true",
        explanation: "Single pair of matching parentheses.",
      },
      {
        input: 's = "()[]{}"',
        output: "true",
        explanation: "Each open bracket is closed by the matching type.",
      },
    ],
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'.",
    ],
  },
  {
    title: "Maximum Subarray",
    description:
      "Given an integer array nums, find the subarray with the largest sum, and return its sum.\n\nA subarray is a contiguous non-empty sequence of elements within an array.",
    difficulty: "Medium",
    tags: ["Array", "Dynamic Programming", "Divide and Conquer"],
    companies: ["Amazon", "Apple", "Google"],
    examples: [
      {
        input: "nums = [-2,1,-3,4,-1,2,1,-5,4]",
        output: "6",
        explanation: "The subarray [4,-1,2,1] has the largest sum 6.",
      },
      {
        input: "nums = [5,4,-1,7,8]",
        output: "23",
        explanation: "The entire array is the subarray with the largest sum.",
      },
    ],
    constraints: ["1 <= nums.length <= 10^5", "-10^4 <= nums[i] <= 10^4"],
  },
  {
    title: "Binary Search",
    description:
      "Given an array of integers nums which is sorted in ascending order, and an integer target, write a function to search target in nums. If target exists, then return its index. Otherwise, return -1.\n\nYou must write an algorithm with O(log n) runtime complexity.",
    difficulty: "Easy",
    tags: ["Array", "Binary Search"],
    companies: ["Google", "Amazon", "Microsoft"],
    examples: [
      {
        input: "nums = [-1,0,3,5,9,12], target = 9",
        output: "4",
        explanation: "9 exists in nums and its index is 4.",
      },
      {
        input: "nums = [-1,0,3,5,9,12], target = 2",
        output: "-1",
        explanation: "2 does not exist in nums so return -1.",
      },
    ],
    constraints: [
      "1 <= nums.length <= 10^4",
      "-10^4 < nums[i], target < 10^4",
      "All the integers in nums are unique.",
      "nums is sorted in ascending order.",
    ],
  },
  {
    title: "Climbing Stairs",
    description:
      "You are climbing a staircase. It takes n steps to reach the top.\n\nEach time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    difficulty: "Easy",
    tags: ["Dynamic Programming", "Math", "Memoization"],
    companies: ["Amazon", "Google", "Uber"],
    examples: [
      {
        input: "n = 2",
        output: "2",
        explanation: "There are two ways to climb: (1+1) or (2).",
      },
      {
        input: "n = 3",
        output: "3",
        explanation: "There are three ways: (1+1+1), (1+2), or (2+1).",
      },
    ],
    constraints: ["1 <= n <= 45"],
  },
  {
    title: "Merge Two Sorted Lists",
    description:
      "You are given the heads of two sorted linked lists list1 and list2.\n\nMerge the two lists into one sorted list. The list should be made by splicing together the nodes of the first two lists.\n\nReturn the head of the merged linked list.",
    difficulty: "Easy",
    tags: ["Linked List", "Recursion"],
    companies: ["Amazon", "Microsoft", "Apple"],
    examples: [
      {
        input: "list1 = [1,2,4], list2 = [1,3,4]",
        output: "[1,1,2,3,4,4]",
        explanation: "Nodes from both lists are merged in sorted order.",
      },
      {
        input: "list1 = [], list2 = [0]",
        output: "[0]",
        explanation: "Merging an empty list with [0] gives [0].",
      },
    ],
    constraints: [
      "The number of nodes in both lists is in the range [0, 50].",
      "-100 <= Node.val <= 100",
      "Both list1 and list2 are sorted in non-decreasing order.",
    ],
  },
  {
    title: "Longest Common Subsequence",
    description:
      "Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.\n\nA common subsequence of two strings is a subsequence that is common to both strings.",
    difficulty: "Medium",
    tags: ["String", "Dynamic Programming"],
    companies: ["Google", "Amazon", "Microsoft"],
    examples: [
      {
        input: 'text1 = "abcde", text2 = "ace"',
        output: "3",
        explanation:
          'The longest common subsequence is "ace" and its length is 3.',
      },
      {
        input: 'text1 = "abc", text2 = "abc"',
        output: "3",
        explanation:
          'The longest common subsequence is "abc" and its length is 3.',
      },
    ],
    constraints: [
      "1 <= text1.length, text2.length <= 1000",
      "text1 and text2 consist of only lowercase English characters.",
    ],
  },
  {
    title: "Number of Islands",
    description:
      "Given an m x n 2D binary grid which represents a map of '1's (land) and '0's (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.",
    difficulty: "Medium",
    tags: ["Array", "Graph", "BFS", "DFS"],
    companies: ["Amazon", "Google", "Facebook"],
    examples: [
      {
        input:
          'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]',
        output: "1",
        explanation: "All land cells are connected, forming one island.",
      },
      {
        input:
          'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]',
        output: "3",
        explanation: "There are 3 separate islands.",
      },
    ],
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      'grid[i][j] is "0" or "1".',
    ],
  },
  {
    title: "Coin Change",
    description:
      "You are given an integer array coins representing coins of different denominations and an integer amount representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.\n\nYou may assume that you have an infinite number of each kind of coin.",
    difficulty: "Medium",
    tags: ["Dynamic Programming", "BFS"],
    companies: ["Amazon", "Google", "Microsoft"],
    examples: [
      {
        input: "coins = [1,5,11], amount = 15",
        output: "3",
        explanation: "15 = 11 + 3×1 is wrong; 15 = 5 + 5 + 5 = 3 coins.",
      },
      {
        input: "coins = [2], amount = 3",
        output: "-1",
        explanation:
          "Amount 3 cannot be made with only coin of denomination 2.",
      },
    ],
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4",
    ],
  },
  {
    title: "Trapping Rain Water",
    description:
      "Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.",
    difficulty: "Hard",
    tags: ["Array", "Two Pointers", "Stack", "Dynamic Programming"],
    companies: ["Google", "Amazon", "Goldman Sachs"],
    examples: [
      {
        input: "height = [0,1,0,2,1,0,1,3,2,1,2,1]",
        output: "6",
        explanation: "The elevation map traps 6 units of rain water.",
      },
      {
        input: "height = [4,2,0,3,2,5]",
        output: "9",
        explanation: "The map traps 9 units of rain water.",
      },
    ],
    constraints: [
      "n == height.length",
      "1 <= n <= 2 * 10^4",
      "0 <= height[i] <= 10^5",
    ],
  },
  {
    title: "Word Search",
    description:
      "Given an m x n grid of characters board and a string word, return true if word exists in the grid.\n\nThe word can be constructed from letters of sequentially adjacent cells, where adjacent cells are horizontally or vertically neighboring. The same letter cell may not be used more than once.",
    difficulty: "Medium",
    tags: ["Array", "Backtracking", "DFS"],
    companies: ["Amazon", "Microsoft", "Airbnb"],
    examples: [
      {
        input:
          'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCCED"',
        output: "true",
        explanation: "The word ABCCED can be found in the board.",
      },
      {
        input:
          'board = [["A","B","C","E"],["S","F","C","S"],["A","D","E","E"]], word = "ABCB"',
        output: "false",
        explanation: "The word ABCB cannot be formed as B cannot be reused.",
      },
    ],
    constraints: [
      "m == board.length",
      "n = board[i].length",
      "1 <= m, n <= 6",
      "1 <= word.length <= 15",
    ],
  },
];

// Competitive Programming pool
const COMPETITIVE_POOL = [
  {
    title: "Longest Increasing Subsequence",
    description:
      "Given an integer array nums, return the length of the longest strictly increasing subsequence.",
    difficulty: "Medium",
    tags: ["Dynamic Programming", "Binary Search"],
    companies: ["Google", "Amazon", "Palantir"],
    examples: [
      {
        input: "nums = [10,9,2,5,3,7,101,18]",
        output: "4",
        explanation:
          "The longest increasing subsequence is [2,3,7,101], with length 4.",
      },
      {
        input: "nums = [0,1,0,3,2,3]",
        output: "4",
        explanation: "The longest increasing subsequence is [0,1,2,3].",
      },
    ],
    constraints: ["1 <= nums.length <= 2500", "-10^4 <= nums[i] <= 10^4"],
  },
  {
    title: "Edit Distance",
    description:
      "Given two strings word1 and word2, return the minimum number of operations required to convert word1 to word2.\n\nYou have the following three operations permitted on a word:\n- Insert a character\n- Delete a character\n- Replace a character",
    difficulty: "Hard",
    tags: ["String", "Dynamic Programming"],
    companies: ["Google", "Amazon", "Uber"],
    examples: [
      {
        input: 'word1 = "horse", word2 = "ros"',
        output: "3",
        explanation:
          "horse→rorse (replace h with r)→rose (delete r)→ros (delete e). 3 operations.",
      },
      {
        input: 'word1 = "intention", word2 = "execution"',
        output: "5",
        explanation: "5 operations needed to convert intention to execution.",
      },
    ],
    constraints: [
      "0 <= word1.length, word2.length <= 500",
      "word1 and word2 consist of lowercase English letters.",
    ],
  },
  {
    title: "Course Schedule (Cycle Detection)",
    description:
      "There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.\n\nReturn true if you can finish all courses. Otherwise, return false.",
    difficulty: "Medium",
    tags: ["Graph", "Topological Sort", "DFS"],
    companies: ["Google", "Facebook", "Uber"],
    examples: [
      {
        input: "numCourses = 2, prerequisites = [[1,0]]",
        output: "true",
        explanation: "Take course 0 first, then course 1. No cycle.",
      },
      {
        input: "numCourses = 2, prerequisites = [[1,0],[0,1]]",
        output: "false",
        explanation: "Courses 0 and 1 form a cycle — impossible to finish.",
      },
    ],
    constraints: [
      "1 <= numCourses <= 2000",
      "0 <= prerequisites.length <= 5000",
      "prerequisites[i].length == 2",
      "All the pairs prerequisites[i] are unique.",
    ],
  },
  {
    title: "Minimum Path Sum",
    description:
      "Given a m x n grid filled with non-negative numbers, find a path from top left to bottom right, which minimizes the sum of all numbers along its path.\n\nNote: You can only move either down or right at any point in time.",
    difficulty: "Medium",
    tags: ["Dynamic Programming", "Array", "Matrix"],
    companies: ["Amazon", "Google", "Microsoft"],
    examples: [
      {
        input: "grid = [[1,3,1],[1,5,1],[4,2,1]]",
        output: "7",
        explanation: "The path 1→3→1→1→1 minimizes the sum to 7.",
      },
      {
        input: "grid = [[1,2,3],[4,5,6]]",
        output: "12",
        explanation: "The path 1→2→3→6 has sum 12.",
      },
    ],
    constraints: [
      "m == grid.length",
      "n == grid[0].length",
      "1 <= m, n <= 200",
      "0 <= grid[i][j] <= 200",
    ],
  },
];

/**
 * Returns `count` randomly selected structured questions from the DSA pool.
 * Questions are shuffled so each session is different.
 */
export function getDSAFallbackQuestions(trackId, count) {
  const pool = trackId === "competitive" ? COMPETITIVE_POOL : DSA_POOL;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  // If pool is smaller than count, repeat from the pool
  const result = [];
  while (result.length < count) {
    result.push(...shuffled);
  }
  return result.slice(0, count);
}
