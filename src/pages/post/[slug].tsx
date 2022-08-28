import { GetStaticPaths, GetStaticProps } from 'next';
import { FiUser } from 'react-icons/fi';
import { RiCalendarLine } from 'react-icons/ri';
import { BiTimeFive } from 'react-icons/bi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { RichText } from 'prismic-dom';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const router = useRouter();
  const humanReadTimeByWords = 200;

  if (router?.isFallback) {
    return <div>Carregando...</div>;
  }

  const sumWords = post?.data?.content?.reduce((acc, value) => {
    // eslint-disable-next-line no-param-reassign
    acc += value?.heading?.split(' ').length;

    value?.body
      ?.map(item => item?.text?.split(' ').length)
      // eslint-disable-next-line no-return-assign, no-param-reassign
      ?.map(word => (acc += word));

    return acc;
  }, 0);

  const readTime = Math.ceil(sumWords / humanReadTimeByWords);

  return (
    <>
      <Head>
        <title>{post?.data?.title} | spacetraveling</title>
      </Head>
      <div className={commonStyles.wrapper}>
        <div className={commonStyles.container}>
          <Header />
        </div>
      </div>

      <img
        src={post?.data?.banner?.url}
        alt="imagem"
        className={styles.postImage}
      />

      <div className={commonStyles.wrapper}>
        <div className={commonStyles.container}>
          <main className={styles.postWrapper}>
            <h1>{post?.data?.title}</h1>

            <div className={styles.postInfo}>
              <div>
                <RiCalendarLine />
                <time>
                  {post?.first_publication_date &&
                    format(
                      new Date(post?.first_publication_date),
                      'dd MMM yyyy',
                      {
                        locale: ptBR,
                      }
                    )}
                </time>
              </div>
              <div>
                <FiUser />
                <span>{post?.data?.author}</span>
              </div>
              <div>
                <BiTimeFive />
                <span>{readTime} min</span>
              </div>
            </div>

            {post?.data?.content?.map(content => (
              <article key={content?.heading} className={styles.postContainer}>
                <h2>{content?.heading}</h2>
                <div
                  className={styles.postContent}
                  // eslint-disable-next-line react/no-danger
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content?.body),
                  }}
                />
              </article>
            ))}
          </main>
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient({});
  const posts = await prismic.getByType('posts');

  const paths = posts?.results?.map(post => ({
    params: {
      slug: post?.uid,
    },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient({});
  const response = await prismic.getByUID('posts', String(params?.slug));

  const post: Post = {
    uid: response?.uid,
    first_publication_date: response?.first_publication_date,
    data: {
      title: response?.data?.title,
      subtitle: response?.data?.subtitle,
      author: response?.data?.author,
      banner: {
        url: response?.data?.banner?.url,
      },
      content: response?.data?.content?.map(content => ({
        heading: content?.heading,
        body: [...content?.body],
      })),
    },
  };

  return {
    props: {
      post,
    },
  };
};
