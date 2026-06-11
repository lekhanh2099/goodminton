export type FunQuote = {
 text: string;
 source: "icanhazdadjoke" | "fallback";
};

const fallbackQuotes = [
 "Đánh cầu không sợ thua, chỉ sợ về nhà vẫn còn nợ tiền sân.",
 "Hôm nay không đập được cầu thì đập heo đất đóng quỹ.",
 "Cầu rơi ngoài sân là lỗi gió. Cầu rơi trong sân là lỗi đồng đội.",
 "Một cú smash đẹp không cứu được ví tiền cuối buổi.",
 "Thua set không buồn, buồn nhất là chưa đóng tiền nước.",
 "Thua là do vợt đã cũ giày thì mòn đừng dỗ thừa kĩ năng.",
];

export async function getFunQuote(): Promise<FunQuote> {
 //  try {
 //   const response = await fetch("https://icanhazdadjoke.com/", {
 //    headers: {
 //     Accept: "application/json",
 //     "User-Agent": "Goodminton (https://github.com/lekhanh2099/goodminton)",
 //    },
 //    next: { revalidate: 60 * 60 * 6 },
 //   });

 //   if (!response.ok) {
 //    throw new Error("Failed to fetch joke");
 //   }

 //   const data = (await response.json()) as { joke?: string };

 //   if (!data.joke) {
 //    throw new Error("Invalid joke response");
 //   }

 //   return {
 //    text: data.joke,
 //    source: "icanhazdadjoke",
 //   };
 //  } catch {
 //   return {
 //    text: fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)],
 //    source: "fallback",
 //   };
 //  }

 return {
  text: fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)],
  source: "fallback",
 };
}
