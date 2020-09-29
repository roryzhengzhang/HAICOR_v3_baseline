class ArgumentNode:
    def __init__(self):
        self.conclusion = ""
        self.premises = []
        self.name = ""

    def set_conclusion(self, conclusion):
        self.conclusion = conclusion

    def add_premise(self, premise):
        self.premises.append(premise)

    def set_name(self, name):
        self.name = name

    def __str__(self):
        answers = ""
        for p in self.premises:
            answers = answers + p + "; "
        answers = answers + self.conclusion
        return answers

    def __repr__(self):
        return "< name: "+self.name+"; promises: "+str(self.premises)+"; conclusion: "+self.conclusion+">"

