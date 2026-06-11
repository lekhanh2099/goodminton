export type FunQuote = {
 text: string;
 source: "icanhazdadjoke" | "fallback";
};

const fallbackQuotes = [
 "Cầu lông không làm tôi giàu, nhưng giúp tôi tiêu tiền rất đều.",
 "Đánh cầu vì sức khỏe, nghỉ giữa hiệp vì hết sức.",
 "Kỹ thuật không có nhiều, nhưng tinh thần ăn thua thì vô hạn.",
 "Cầu lông là môn thể thao duy nhất khiến tôi vừa chạy vừa chửi thề.",
 'Người ta yêu bằng ánh mắt, tôi yêu bằng tiếng "bụp" của quả cầu.',
 "Đi làm để kiếm tiền, đánh cầu để kiếm niềm vui, cuối tháng kiếm mì gói.",
 "Trình độ chưa tới đâu nhưng đồ cầu phải xịn trước đã.",
 "Mỗi cú smash là một lần trút bỏ áp lực cuộc đời... và đôi khi là trút luôn cả cây vợt.",
 "Thắng thì do chiến thuật, thua thì do đèn chói với sân trơn.",
 "Đánh hay không quan trọng, quan trọng là có mặt đầy đủ lúc chụp hình.",
 'Đối thủ mạnh không đáng sợ, đáng sợ nhất là đồng đội nói: "Cầu của bà đó!"',
 "Chúng tôi không nghiện cầu lông, chúng tôi chỉ không biết sống sao nếu cuối tuần không ra sân.",
 "Lên sân ai cũng là Lin Dan, xuống sân mới nhớ mai còn đi làm.",
 "Tuổi tác chỉ là con số, số lần đau cơ mới là vấn đề.",
 "Đánh cầu là môn thể thao duy nhất khiến người ta vừa chạy vừa tự trách bản thân.",
 "Mục tiêu ban đầu là rèn luyện sức khỏe, mục tiêu hiện tại là phục thù trận hôm trước.",
 "Không phải dân chuyên, chỉ là dân vãng lai nhưng rất hay cay cú.",
 "Đến sân với tâm thế giao lưu, ra về với quyết tâm phục hận.",
 "Cầu rơi thì nhặt được, lòng tự trọng rơi sau trận thua thì khó kiếm lại.",
 'Smash không mạnh bằng cái miệng hứa: "Trận sau tao đánh nghiêm túc."',
 "Cầu lông dạy ta một điều: có những quả tưởng của mình nhưng thật ra là của người khác.",
 "Thua là do vợt đã cũ, giày thì mòn, đừng đổ thừa kỹ năng.",
 "Hạnh phúc đôi khi chỉ là trái cầu không bị dập.",
 "Sống là phải có đam mê, đam mê của tôi biết bay.",
 "Mắt nhìn cầu, tim nhìn lịch sân.",
 "Chơi vui là chính, cà khịa là phụ.",
 "Đánh hết mình – đau hết cỡ – mai đánh tiếp.",
 "Không cần vô địch, chỉ cần đủ người đánh đôi.",
 "Tinh thần thể thao, trình độ hên xui.",
 "Chơi có tâm – smash có tầm – đau cơ có thật.",
 "Hội người lớn nhưng vẫn chạy theo trái cầu.",
 "Đến sân là vui, ra về là than đau.",
 "Đánh cầu hết sức, ăn uống hết mình.",
 "Chúng tôi không hoàn hảo, nhưng luôn đủ chuyện để cười.",
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
