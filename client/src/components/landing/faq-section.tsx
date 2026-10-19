import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const questions = [
  {
    question: "How do I request a ride?",
    answer: "Enter your pickup and destination, review the available vehicle types and estimated fare, then confirm your ride request.",
  },
  {
    question: "Can I see my fare before booking?",
    answer: "Yes. RideX calculates an estimate from your route, vehicle type, distance, and expected duration before you request a ride.",
  },
  {
    question: "How do payments and receipts work?",
    answer: "Pay securely after your completed ride. Your payment status and receipt are available from your ride details.",
  },
  {
    question: "How can I start driving with RideX?",
    answer: "Create a driver account with your vehicle details. Once signed in, you can manage your driver profile and availability.",
  },
];

export function FaqSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-28">
      <Reveal>
        <SectionHeading
          eyebrow="A few quick answers"
          title="Questions before you go?"
          description="Here are some useful details to help you get started with RideX."
          centered={false}
        />
      </Reveal>
      <Reveal delay={0.08}>
        <Accordion type="single" collapsible className="w-full">
          {questions.map(({ question, answer }, index) => (
            <AccordionItem key={question} value={`question-${index}`}>
              <AccordionTrigger className="text-left text-sm sm:text-base">{question}</AccordionTrigger>
              <AccordionContent>{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Reveal>
    </section>
  );
}
