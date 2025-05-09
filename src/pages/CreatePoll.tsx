
import Header from "@/components/layout/Header";
import PollForm from "@/components/polls/PollForm";

const CreatePoll = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-6 max-w-3xl mx-auto w-full">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create Poll</h1>
          <p className="text-muted-foreground">Ask a question and get community insights</p>
        </div>
        
        <PollForm />
      </main>
    </div>
  );
};

export default CreatePoll;
