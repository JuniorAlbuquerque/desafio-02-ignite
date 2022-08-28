import { GetStaticProps } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { RiCalendarLine } from 'react-icons/ri';
import { FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { useState } from 'react';
import { PrismicDocument, Query } from '@prismicio/types';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

const formatPosts = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
): Post[] => {
  const results = data?.map(post => {
    return {
      uid: post.uid,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return results;
};

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [currentPage, setCurrentPage] = useState(postsPagination?.next_page);
  const [posts, setPosts] = useState<Post[]>(
    formatPosts(postsPagination?.results)
  );

  const handleNextPage = async (): Promise<void> => {
    if (!currentPage) return;

    const newPosts: Query<
      PrismicDocument<Record<string, any>, string, string>
    > = await (await fetch(currentPage)).json();

    setCurrentPage(newPosts?.next_page);
    setPosts(prevState => [...prevState, ...formatPosts(newPosts?.results)]);
  };

  return (
    <div className={commonStyles.wrapper}>
      <main className={commonStyles.container}>
        <div className={styles.logo}>
          <Image
            src="/logo.svg"
            alt="BLOG"
            width="239"
            height="26"
            objectFit="cover"
          />
        </div>

        <div className={styles.posts}>
          {posts?.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={styles.postInfo}>
                  <div>
                    <RiCalendarLine />
                    <time>{post.first_publication_date}</time>
                  </div>
                  <div>
                    <FiUser />
                    <span>{post.data.author}</span>
                  </div>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {currentPage && (
          <button
            type="button"
            className={styles.btnMorePosts}
            onClick={handleNextPage}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient({});
  const postsResponse = await prismic.getByType('posts', {
    fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
    pageSize: 1,
  });

  const postsPagination = {
    next_page: postsResponse?.next_page,
    results: postsResponse?.results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
