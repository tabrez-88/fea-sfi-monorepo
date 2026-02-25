import BlogArticle, { ContentBlock, ShareLink } from '@/components/Blog/BlogArticle'
import RelatedPosts, { RelatedPost } from '@/components/Blog/RelatedPosts'
import Container from '@/components/shared/Container'

const shareLinks: ShareLink[] = [
  { icon: 'facebook', href: '#', label: 'Facebook' },
  { icon: 'instagram', href: '#', label: 'Instagram' },
  { icon: 'linkedin', href: '#', label: 'LinkedIn' },
  { icon: 'x', href: '#', label: 'X' },
  { icon: 'youtube', href: '#', label: 'YouTube' },
]

const content: ContentBlock[] = [
  {
    type: 'paragraph',
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Felis amet laoreet phasellus sed volutpat. Tellus fringilla proin faucibus eget odio eu. Ipsum augue tellus eu risus vehicula ac dolor Congue ut congue velit ipsum aliquam est. In mauris lectus uma pretium condimentum aliquet in lectus. Turpis nulla pellentesque ante ornare. Integer cursus faucibus facilisis fermentum ultrices augue. Suscipit massa arcu at feugiat nullam eros ullamcorper morbi amet. Fringilla consectetur tristique venenatis integer arcu aliquam lacus porttitor donec. Nibh sapien mattis cras lobortis tortor. Sit felis id erat consequat. Aenean velit odio duis odio sapien adipiscing. Lectus vel pharetra morbi mauris lacinia aliquam. Semper tristique eget consectetur mattis velit est suspendisse. Arcu enim mauris cursus morbi integer consectetur nisl euismod.',
  },
  {
    type: 'paragraph',
    text: 'Turpis nulla pellentesque ante ornare. Integer cursus faucibus facilisis fermentum ultrices augue. Suscipit massa arcu at feugiat nullam eros ullamcorper morbi amet. Fringilla tristique venenatis integer arcu aliquam lacus porttitor donec. Nibh sapien mattis cras lobortis. Sit felis id erat consequat. Aenean velit odio duis odio sapien adipiscing. Lectus vel pharetra morbi mauris lacinia aliquam. Semper tristique eget consectetur mattis velit est suspendisse. Arcu mauris cursus morbi integer consectetur nisl euismod.',
  },
  {
    type: 'image',
    src: '/assets/studio.jpg',
    alt: 'Blog content',
  },
  {
    type: 'paragraph',
    text: 'Integer arcu aliquam lacus porttitor donec. Nibh sapien mattis cras lobortis tortor. Sit felis id erat consequat. Aenean velit odio duis odio sapien adipiscing. Lectus vel pharetra morbi mauris lacinia aliquam. Semper tristique eget consectetur mattis velit est suspendisse. Arcu enim mauris cursus morbi integer consectetur nisl euismod.',
  },
  {
    type: 'paragraph',
    text: 'Ipsum augue tellus eu risus vehicula ac dolor Congue ut congue velit ipsum aliquam est. In mauris lectus uma pretium condimentum aliquet in lectus Turpis nulla pellentesque ante ornare. Integer cursus faucibus facilisis fermentum ultrices augue. Suscipit massa arcu at feugiat nullam eros ullamcorper morbi amet. Fringilla consectetur tristique venenatis integer arcu aliquam lacus porttitor donec. Nibh sapien mattis cras lobortis tortor. Sit felis id erat consequat. Aenean velit odio duis odio sapien adipiscing. Lectus vel pharetra morbi mauris lacinia aliquam. Semper tristique eget consectetur mattis velit est suspendisse.',
  },
  {
    type: 'image',
    src: '/assets/studio2.jpg',
    alt: 'Blog content',
  },
  {
    type: 'paragraph',
    text: 'Integer arcu aliquam lacus porttitor donec. Nibh sapien mattis cras lobortis tortor. Sit felis id erat consequat. Aenean velit odio duis odio sapien adipiscing. Lectus vel pharetra morbi mauris lacinia aliquam. Semper tristique eget consectetur mattis velit est suspendisse. Arcu enim mauris cursus morbi integer consectetur nisl euismod.',
  },
]

const relatedPosts: RelatedPost[] = [
  {
    id: 2,
    image: '/assets/studio.jpg',
    badge: 'Newsletter',
    title: 'Ut enim ad minim veniam, quis nostrud exercitation',
    date: '23 Feb, 2024',
    excerpt:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupid tation.',
  },
  {
    id: 3,
    image: '/assets/studio2.jpg',
    badge: 'Newsletter',
    title: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed',
    date: '23 Feb, 2024',
    excerpt:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupid tation.',
  },
]

export default function BlogDetailPage() {
  return (
    <div>
      <Container>
        <section className="flex flex-col lg:flex-row gap-10">
          <BlogArticle
            heroImage="/assets/studio2.jpg"
            title="Ut enim ad minim veniam, quis nostrud exercitation"
            date="23 Feb, 2024"
            shareLinks={shareLinks}
            content={content}
          />
          <RelatedPosts posts={relatedPosts} />
        </section>
      </Container>
    </div>
  )
}
