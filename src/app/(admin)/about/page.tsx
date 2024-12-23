type Props = {
  params: {
    id: string;
  };
};

export const generateMetadata = ({ params }: Props) => {
  return {
    title: "ㅎㅇ",
    description: params.id + "하이루",
  };
};

const AboutPage = () => {
  return <>about Page</>;
};

export default AboutPage;
